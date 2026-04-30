package amqp

import (
	"fmt"

	"github.com/coderoster/code-improve/internal/contracts"
	amqplib "github.com/rabbitmq/amqp091-go"
)

type Client struct {
	conn    *amqplib.Connection
	Channel *amqplib.Channel
}

func Connect(url string, prefetch int) (*Client, error) {
	conn, err := amqplib.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("amqp dial: %w", err)
	}
	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("amqp channel: %w", err)
	}
	if err := ch.ExchangeDeclare(contracts.ExchangeName, "topic", true, false, false, false, nil); err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("exchange: %w", err)
	}
	if err := ch.ExchangeDeclare(contracts.DeadLetterExchange, "topic", true, false, false, false, nil); err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("dlx: %w", err)
	}
	if _, err := ch.QueueDeclare(
		contracts.AICodeImproveQueue,
		true,
		false,
		false,
		false,
		amqplib.Table{
			"x-message-ttl":             int32(600_000),
			"x-dead-letter-exchange":    contracts.DeadLetterExchange,
			"x-dead-letter-routing-key": contracts.AICodeImproveDeadRoutingKey,
		},
	); err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("queue declare: %w", err)
	}
	if err := ch.QueueBind(contracts.AICodeImproveQueue, contracts.AICodeImproveTopic, contracts.ExchangeName, false, nil); err != nil {
		ch.Close()
		conn.Close()
		return nil, fmt.Errorf("queue bind: %w", err)
	}
	if prefetch > 0 {
		if err := ch.Qos(prefetch, 0, false); err != nil {
			ch.Close()
			conn.Close()
			return nil, fmt.Errorf("qos: %w", err)
		}
	}
	return &Client{conn: conn, Channel: ch}, nil
}

func (c *Client) Close() {
	if c.Channel != nil {
		_ = c.Channel.Close()
	}
	if c.conn != nil {
		_ = c.conn.Close()
	}
}
