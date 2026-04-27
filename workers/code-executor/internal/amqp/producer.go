package amqp

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/coderoster/code-executor/internal/contracts"
	amqplib "github.com/rabbitmq/amqp091-go"
)

// Producer publishes events into the platform-wide topic exchange.
type Producer struct {
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
