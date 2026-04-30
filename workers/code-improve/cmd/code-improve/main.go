package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"

	amqpclient "github.com/coderoster/code-improve/internal/amqp"
	"github.com/coderoster/code-improve/internal/config"
	"github.com/coderoster/code-improve/internal/contracts"
	"github.com/coderoster/code-improve/internal/job"
	"github.com/coderoster/code-improve/internal/openai"
	"github.com/coderoster/code-improve/internal/redisx"
	"github.com/coderoster/code-improve/internal/store"
	amqplib "github.com/rabbitmq/amqp091-go"
)

type payload struct {
	JobID string `json:"jobId"`
}

func main() {
	cfg := config.FromEnv()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL required")
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		ch := make(chan os.Signal, 1)
		signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM)
		<-ch
		log.Println("code-improve: shutdown")
		cancel()
	}()

	dbpool, err := store.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	defer dbpool.Close()

	var rcli *redisx.Client
	if cfg.RedisURL != "" {
		var err error
		rcli, err = redisx.Connect(cfg.RedisURL)
		if err != nil {
			log.Fatalf("redis: %v", err)
		}
		defer rcli.Close()
	}

	ai := openai.NewClient(cfg.OpenAIAPIKey, cfg.OpenAIBaseURL, cfg.HTTPTimeoutSec)
	proc := &job.Processor{
		DB:    dbpool,
		AI:    ai,
		Redis: rcli,
		Cfg:   cfg,
	}

	client, err := amqpclient.Connect(cfg.RabbitURL, cfg.Prefetch)
	if err != nil {
		log.Fatalf("amqp: %v", err)
	}
	defer client.Close()

	deliveries, err := client.Channel.Consume(
		contracts.AICodeImproveQueue,
		"code-improve-go",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("consume: %v", err)
	}

	sem := make(chan struct{}, max(1, cfg.Prefetch))
	var wg sync.WaitGroup

	log.Printf("code-improve worker listening (prefetch=%d)", cfg.Prefetch)

	for {
		select {
		case <-ctx.Done():
			wg.Wait()
			return
		case d, ok := <-deliveries:
			if !ok {
				wg.Wait()
				return
			}
			wg.Add(1)
			sem <- struct{}{}
			go func(d amqplib.Delivery) {
				defer wg.Done()
				defer func() { <-sem }()
				handleDelivery(ctx, proc, client.Channel, d)
			}(d)
		}
	}
}

func handleDelivery(ctx context.Context, proc *job.Processor, ch *amqplib.Channel, d amqplib.Delivery) {
	var p payload
	if err := json.Unmarshal(d.Body, &p); err != nil || p.JobID == "" {
		log.Printf("code-improve: bad payload: %q", string(d.Body))
		_ = d.Nack(false, false)
		return
	}
	if err := proc.Run(ctx, p.JobID); err != nil {
		log.Printf("code-improve: job %s: %v", p.JobID, err)
		_ = d.Nack(false, false)
		return
	}
	if err := ch.Ack(d.DeliveryTag, false); err != nil {
		log.Printf("code-improve: ack failed: %v", err)
	}
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
