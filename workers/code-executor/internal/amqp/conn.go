// Package amqp wraps the RabbitMQ client used by the executor.
package amqp

import (
	"fmt"
	"log"

	"github.com/coderoster/code-executor/internal/contracts"
	amqplib "github.com/rabbitmq/amqp091-go"
)

// Client owns the connection and channel used by every consumer/producer in
// the worker. We keep a single channel per process to keep the topology
// simple — the executor is CPU-bound on docker exec rather than AMQP I/O.
type Client struct {
	conn    *amqplib.Connection
	Channel *amqplib.Channel
}

// Connect establishes the AMQP connection and asserts the topic exchange so
// the producer can publish without further setup.
func Connect(url string) (*Client, error) {
	conn, err := amqplib.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("amqp dial: %w", err)
	}
	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("amqp channel: %w", err)
	}
	if err := channel.ExchangeDeclare(
		contracts.ExchangeName,
		"topic",
		true,
		false,
		false,
		false,
		nil,
	); err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("declare exchange: %w", err)
	}
	if err := channel.Qos(4, 0, false); err != nil {
		log.Printf("amqp: qos setup failed: %v", err)
	}
	return &Client{conn: conn, Channel: channel}, nil
}

// Close tears down both the channel and the connection.
func (c *Client) Close() {
	if c.Channel != nil {
		_ = c.Channel.Close()
	}
	if c.conn != nil {
		_ = c.conn.Close()
	}
}
