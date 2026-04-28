package amqp

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/coderoster/code-executor/internal/contracts"
	amqplib "github.com/rabbitmq/amqp091-go"
)

// dispatchConcurrency caps parallel sandbox runs per worker process (matches QoS prefetch in conn.go).
const dispatchConcurrency = 4

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

	sem := make(chan struct{}, dispatchConcurrency)
	var wg sync.WaitGroup

	for {
		select {
		case <-ctx.Done():
			wg.Wait()
			return ctx.Err()
		case delivery, ok := <-deliveries:
			if !ok {
				wg.Wait()
				return fmt.Errorf("consumer channel closed")
			}
			wg.Add(1)
			sem <- struct{}{}
			go func(d amqplib.Delivery) {
				defer wg.Done()
				defer func() { <-sem }()
				c.dispatch(ctx, d, handler, producer)
			}(delivery)
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
		// Do not requeue — avoids infinite loops; broker dead-letters per queue DLX settings.
		_ = delivery.Nack(false, false)
		return
	}
	_ = delivery.Ack(false)
}
