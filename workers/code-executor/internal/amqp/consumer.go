package amqp

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/coderoster/code-executor/internal/contracts"
	amqplib "github.com/rabbitmq/amqp091-go"
)

// Handler processes one ExecutionRequested message.
type Handler func(ctx context.Context, request contracts.ExecutionRequested) (contracts.ExecutionCompleted, error)

// Consume subscribes to the executor queue and dispatches each message to
// `handler`. Returns when the channel closes or the context is cancelled.
func (c *Client) Consume(ctx context.Context, queue string, handler Handler, producer *Producer) error {
	deliveries, err := c.Channel.Consume(
		queue,
		"code-executor",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("consume: %w", err)
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case delivery, ok := <-deliveries:
			if !ok {
				return fmt.Errorf("consumer channel closed")
			}
			c.dispatch(ctx, delivery, handler, producer)
		}
	}
}

func (c *Client) dispatch(
	ctx context.Context,
	delivery amqplib.Delivery,
	handler Handler,
	producer *Producer,
) {
	var request contracts.ExecutionRequested
	if err := json.Unmarshal(delivery.Body, &request); err != nil {
		log.Printf("consumer: bad payload: %v", err)
		_ = delivery.Nack(false, false)
		return
	}

	result, err := handler(ctx, request)
	if err != nil {
		log.Printf("consumer: handler failed for %s: %v", request.ExecutionID, err)
		message := err.Error()
		result = contracts.ExecutionCompleted{
			ExecutionID:  request.ExecutionID,
			Status:       "failed",
			ErrorMessage: &message,
			TestResults:  []contracts.TestResult{},
		}
	}

	if err := producer.Publish(ctx, contracts.ExecutionCompletedTopic, result); err != nil {
		log.Printf("consumer: publish failed for %s: %v", request.ExecutionID, err)
		_ = delivery.Nack(false, true)
		return
	}
	_ = delivery.Ack(false)
}
