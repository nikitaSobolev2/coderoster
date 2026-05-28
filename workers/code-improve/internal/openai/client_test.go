package openai

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestComplete_ReturnsTextOn200(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/chat/completions", r.URL.Path)
		assert.Equal(t, "Bearer key", r.Header.Get("Authorization"))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"choices":[{"message":{"content":"{\"answer\":\"42\"}"}}]}`))
	}))
	defer server.Close()

	client := NewClient("key", server.URL, 5)
	content, err := client.ChatJSONNonStreaming(context.Background(), "gpt-4o-mini", "sys", "user")
	require.NoError(t, err)
	assert.Contains(t, content, "42")
}

func TestComplete_ReturnsErrorOn429(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Retry-After", "60")
		w.WriteHeader(http.StatusTooManyRequests)
		_, _ = w.Write([]byte(`{"error":"rate_limited"}`))
	}))
	defer server.Close()

	client := NewClient("key", server.URL, 5)
	_, err := client.ChatJSONNonStreaming(context.Background(), "gpt-4o-mini", "sys", "user")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "429")
}

func TestComplete_PropagatesContextCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	client := NewClient("key", "http://127.0.0.1:1", 5)
	_, err := client.ChatJSONNonStreaming(ctx, "gpt-4o-mini", "sys", "user")
	require.Error(t, err)
}

func TestComplete_ReturnsErrorWhenChoicesEmpty(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"choices":[]}`))
	}))
	defer server.Close()

	client := NewClient("key", server.URL, 5)
	_, err := client.ChatJSONNonStreaming(context.Background(), "gpt-4o-mini", "sys", "user")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "empty choices")
}
