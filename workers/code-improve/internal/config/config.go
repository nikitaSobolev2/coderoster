package config

import (
	"os"
	"strconv"
)

// FromEnv loads worker configuration (parity with Node `env` + docker-compose).
func FromEnv() Config {
	apiKey := os.Getenv("AI_CODE_IMPROVE_API_KEY")
	if apiKey == "" {
		apiKey = os.Getenv("OPENAI_API_KEY")
	}
	return Config{
		DatabaseURL:          os.Getenv("DATABASE_URL"),
		RabbitURL:            getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672"),
		RedisURL:             getenv("REDIS_URL", "redis://redis:6379"),
		OpenAIAPIKey:         apiKey,
		OpenAIBaseURL:        getenv("AI_CODE_IMPROVE_BASE_URL", "https://api.openai.com/v1"),
		CircuitFailThreshold: intEnv("AI_CODE_IMPROVE_CB_THRESHOLD", 5),
		CircuitOpenSeconds:   intEnv("AI_CODE_IMPROVE_CB_OPEN_SEC", 120),
		HTTPTimeoutSec:       intEnv("AI_CODE_IMPROVE_HTTP_TIMEOUT_SEC", 600),
		Prefetch:             intEnv("CODE_IMPROVE_AMQP_PREFETCH", 2),
	}
}

type Config struct {
	DatabaseURL          string
	RabbitURL            string
	RedisURL             string
	OpenAIAPIKey         string
	OpenAIBaseURL        string
	CircuitFailThreshold int
	CircuitOpenSeconds   int
	HTTPTimeoutSec       int
	Prefetch             int
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func intEnv(k string, def int) int {
	s := os.Getenv(k)
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}
