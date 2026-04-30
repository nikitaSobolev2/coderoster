package redisx

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	keyFailures  = "ai:improve:cb:failures"
	keyOpenUntil = "ai:improve:cb:openUntil"
)

type Client struct {
	rdb *redis.Client
}

func Connect(redisURL string) (*Client, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("redis url: %w", err)
	}
	rdb := redis.NewClient(opts)
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}
	return &Client{rdb: rdb}, nil
}

func (c *Client) Close() error {
	if c == nil || c.rdb == nil {
		return nil
	}
	return c.rdb.Close()
}

// RecordFailure mirrors legacy Node circuit-breaker semantics (Redis keys).
func (c *Client) RecordFailure(ctx context.Context, threshold, openSec int) error {
	if c == nil || c.rdb == nil {
		return nil
	}
	n, err := c.rdb.Incr(ctx, keyFailures).Result()
	if err != nil {
		return err
	}
	_ = c.rdb.Expire(ctx, keyFailures, 120*time.Second).Err()
	if n >= int64(threshold) {
		openMS := openSec * 1000
		until := time.Now().Add(time.Duration(openMS) * time.Millisecond).UnixMilli()
		_ = c.rdb.Set(ctx, keyOpenUntil, strconv.FormatInt(until, 10), time.Duration(openMS)*time.Millisecond).Err()
		_, _ = c.rdb.Del(ctx, keyFailures).Result()
	}
	return nil
}

func (c *Client) ClearFailureStreak(ctx context.Context) error {
	if c == nil {
		return nil
	}
	_, err := c.rdb.Del(ctx, keyFailures).Result()
	return err
}
