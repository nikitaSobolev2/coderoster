// Binary code-executor consumes execution.requested messages, runs the
// payload in a sandboxed Docker container, and publishes the result.
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/coderoster/code-executor/internal/amqp"
	"github.com/coderoster/code-executor/internal/contracts"
	"github.com/coderoster/code-executor/internal/sandbox"
)

func main() {
	cfg := loadConfig()
	log.Printf("code-executor starting (timeout=%dms, memory=%dMB)", cfg.TimeoutMs, cfg.MemoryMB)

	runner, err := sandbox.New(cfg)
	if err != nil {
		log.Fatalf("sandbox: %v", err)
	}

	client, err := amqp.Connect(envOr("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672"))
	if err != nil {
		log.Fatalf("amqp: %v", err)
	}
	defer client.Close()

	producer := amqp.NewProducer(client.Channel)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		signals := make(chan os.Signal, 1)
		signal.Notify(signals, syscall.SIGTERM, syscall.SIGINT)
		<-signals
		log.Println("shutting down")
		cancel()
	}()

	handler := func(ctx context.Context, request contracts.ExecutionRequested) (contracts.ExecutionCompleted, error) {
		return runner.Run(ctx, request), nil
	}

	if err := client.Consume(ctx, contracts.ExecutionRequestedQueue, handler, producer); err != nil {
		log.Fatalf("consume: %v", err)
	}
}

func loadConfig() sandbox.Config {
	return sandbox.Config{
		PythonImage: envOr("WORKER_PYTHON_IMAGE", "python:3.12-slim"),
		PHPImage:    envOr("WORKER_PHP_IMAGE", "php:8.3-cli-alpine"),
		TimeoutMs:   intEnv("EXECUTION_TIMEOUT_MS", 5000),
		MemoryMB:    int64(intEnv("EXECUTION_MEMORY_MB", 128)),
		CPUs:        floatEnv("EXECUTION_CPUS", 0.5),
		PidsLimit:   int64(intEnv("EXECUTION_PIDS_LIMIT", 64)),
		TmpfsBytes:  64 * 1024 * 1024,
	}
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func intEnv(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func floatEnv(key string, fallback float64) float64 {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return fallback
	}
	return parsed
}
