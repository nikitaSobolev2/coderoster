//go:build integration

package sandbox

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/coderoster/code-executor/internal/contracts"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Gated behind `go test -tags=integration` (requires docker.sock and pull
// access to python:3.12-slim / php:8.3-cli-alpine).

func newIntegrationRunner(t *testing.T) *Runner {
	t.Helper()
	if os.Getenv("INTEGRATION") == "" {
		t.Skip("set INTEGRATION=1 to run docker-bound tests")
	}
	r, err := New(Config{
		PythonImage:        "python:3.12-slim",
		PHPImage:           "php:8.3-cli-alpine",
		TimeoutMs:          5000,
		ImagePullTimeoutMs: 900000,
		MemoryMB:           128,
		CPUs:               0.5,
		PidsLimit:          64,
	})
	require.NoError(t, err)
	return r
}

func TestRun_ExecutesPythonHelloWorldUnderFiveSeconds(t *testing.T) {
	runner := newIntegrationRunner(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	result := runner.Run(ctx, contracts.ExecutionRequested{
		ExecutionID: "test-1",
		Language:    "python",
		Code:        "print('Hello, World')",
		Mode:        contracts.ModeRun,
	})
	assert.Equal(t, "success", result.Status)
	assert.Contains(t, result.Stdout, "Hello, World")
}

func TestRun_TimesOutAfterTimeoutMs(t *testing.T) {
	runner := newIntegrationRunner(t)
	runner.config.TimeoutMs = 500
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	result := runner.Run(ctx, contracts.ExecutionRequested{
		ExecutionID: "test-2",
		Language:    "python",
		Code:        "import time; time.sleep(5)",
		Mode:        contracts.ModeRun,
	})
	assert.Equal(t, "timeout", result.Status)
}
