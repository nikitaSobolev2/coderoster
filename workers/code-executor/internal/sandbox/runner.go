// Package sandbox runs untrusted user code in tightly-restricted Docker
// containers. One container per execution, never reused.
package sandbox

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/coderoster/code-executor/internal/contracts"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/strslice"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

// Config bundles the limits applied to every spawned container.
type Config struct {
	PythonImage  string
	PHPImage     string
	TimeoutMs    int
	MemoryMB     int64
	CPUs         float64
	PidsLimit    int64
	TmpfsBytes   int64
}

// Runner orchestrates one container per execution.
type Runner struct {
	docker *client.Client
	config Config
}

// New creates a Runner using the default Docker SDK client.
func New(cfg Config) (*Runner, error) {
	docker, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("docker client: %w", err)
	}
	if cfg.TmpfsBytes <= 0 {
		cfg.TmpfsBytes = 64 * 1024 * 1024
	}
	return &Runner{docker: docker, config: cfg}, nil
}

// Run executes the code carried by `request` and returns the structured
// result (never an error — runtime failures map to a `failed` status).
func (r *Runner) Run(ctx context.Context, request contracts.ExecutionRequested) contracts.ExecutionCompleted {
	image, cmd, err := r.commandFor(request.Language)
	if err != nil {
		message := err.Error()
		return contracts.ExecutionCompleted{
			ExecutionID:  request.ExecutionID,
			Status:       "failed",
			ErrorMessage: &message,
			TestResults:  []contracts.TestResult{},
		}
	}

	timeout := time.Duration(r.config.TimeoutMs) * time.Millisecond
	runCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	stdout, stderr, runtimeMs, status, runErr := r.execute(runCtx, image, cmd, request.Code)

	completed := contracts.ExecutionCompleted{
		ExecutionID:  request.ExecutionID,
		Status:       status,
		Stdout:       stdout,
		Stderr:       stderr,
		RuntimeMs:    runtimeMs,
		Passed:       status == "success" && stderr == "" && strings.TrimSpace(stdout) != "",
		TestResults:  buildBaseTests(stdout, stderr, status),
	}
	if runErr != nil {
		message := runErr.Error()
		completed.ErrorMessage = &message
	}
	return completed
}

func (r *Runner) commandFor(language string) (string, []string, error) {
	switch language {
	case "python":
		return r.config.PythonImage, []string{"python3", "-"}, nil
	case "php":
		return r.config.PHPImage, []string{"php"}, nil
	default:
		return "", nil, fmt.Errorf("unsupported language %q", language)
	}
}

func (r *Runner) execute(
	ctx context.Context,
	image string,
	cmd []string,
	code string,
) (string, string, int, string, error) {
	hostCfg := r.hostConfig()
	containerCfg := &container.Config{
		Image:        image,
		Cmd:          strslice.StrSlice(cmd),
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		OpenStdin:    true,
		StdinOnce:    true,
		Tty:          false,
		User:         "nobody",
		WorkingDir:   "/tmp",
		NetworkDisabled: true,
	}

	created, err := r.docker.ContainerCreate(ctx, containerCfg, hostCfg, nil, nil, "")
	if err != nil {
		return "", "", 0, "failed", fmt.Errorf("container create: %w", err)
	}
	defer func() {
		removeCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = r.docker.ContainerRemove(removeCtx, created.ID, container.RemoveOptions{Force: true})
	}()

	hijack, err := r.docker.ContainerAttach(ctx, created.ID, container.AttachOptions{
		Stream: true,
		Stdin:  true,
		Stdout: true,
		Stderr: true,
	})
	if err != nil {
		return "", "", 0, "failed", fmt.Errorf("attach: %w", err)
	}
	defer hijack.Close()

	if err := r.docker.ContainerStart(ctx, created.ID, container.StartOptions{}); err != nil {
		return "", "", 0, "failed", fmt.Errorf("start: %w", err)
	}

	go func() {
		_, _ = io.Copy(hijack.Conn, strings.NewReader(code))
		_ = hijack.CloseWrite()
	}()

	var stdout, stderr bytes.Buffer
	copyDone := make(chan error, 1)
	go func() {
		_, err := stdcopy.StdCopy(&stdout, &stderr, hijack.Reader)
		copyDone <- err
	}()

	start := time.Now()
	statusCh, errCh := r.docker.ContainerWait(ctx, created.ID, container.WaitConditionNotRunning)
	status := "success"
	var runErr error
	select {
	case <-ctx.Done():
		_ = r.docker.ContainerKill(context.Background(), created.ID, "SIGKILL")
		status = "timeout"
		runErr = ctx.Err()
	case waitErr := <-errCh:
		if waitErr != nil && !errors.Is(waitErr, context.Canceled) {
			status = "failed"
			runErr = waitErr
		}
	case waitStatus := <-statusCh:
		if waitStatus.StatusCode != 0 {
			status = "failed"
		}
	}
	<-copyDone
	runtimeMs := int(time.Since(start).Milliseconds())
	return stdout.String(), stderr.String(), runtimeMs, status, runErr
}

func (r *Runner) hostConfig() *container.HostConfig {
	memory := r.config.MemoryMB * 1024 * 1024
	return &container.HostConfig{
		ReadonlyRootfs: true,
		NetworkMode:    "none",
		AutoRemove:     false,
		Resources: container.Resources{
			Memory:    memory,
			NanoCPUs:  int64(r.config.CPUs * 1e9),
			PidsLimit: pointer(r.config.PidsLimit),
		},
		Tmpfs: map[string]string{
			"/tmp": fmt.Sprintf("size=%d", r.config.TmpfsBytes),
		},
		CapDrop:     strslice.StrSlice{"ALL"},
		SecurityOpt: []string{"no-new-privileges"},
	}
}

func pointer[T any](v T) *T {
	return &v
}

func buildBaseTests(stdout, stderr, status string) []contracts.TestResult {
	passed := status == "success" && stderr == "" && strings.TrimSpace(stdout) != ""
	actual := strings.TrimSpace(stdout)
	expectedLabel := "non-empty stdout"
	var message *string
	if !passed {
		fallback := stderr
		if fallback == "" {
			fallback = "no stdout"
		}
		message = &fallback
	}
	return []contracts.TestResult{
		{
			Name:     "Базовый прогон",
			Passed:   passed,
			Expected: &expectedLabel,
			Actual:   &actual,
			Message:  message,
		},
	}
}
