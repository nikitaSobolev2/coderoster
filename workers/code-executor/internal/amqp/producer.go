package amqp

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/coderoster/code-executor/internal/contracts"
	amqplib "github.com/rabbitmq/amqp091-go"
)

// Producer publishes events into the platform-wide topic exchange.
// Publish serializes channel access — amqp091-go Channel is not safe for concurrent Publish.
type Producer struct {
	mu      sync.Mutex
	channel *amqplib.Channel
}

// NewProducer wraps an existing channel.
func NewProducer(channel *amqplib.Channel) *Producer {
	return &Producer{channel: channel}
}

// Publish sends a JSON-encoded payload to the topic exchange.
func (p *Producer) Publish(ctx context.Context, topic string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.channel.PublishWithContext(
		ctx,
		contracts.ExchangeName,
		topic,
		false,
		false,
		amqplib.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqplib.Persistent,
			Body:         body,
		},
	)
}
