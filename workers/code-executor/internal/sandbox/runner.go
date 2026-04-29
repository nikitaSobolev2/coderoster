// Package sandbox runs untrusted user code in tightly-restricted Docker
// containers. One container per execution, never reused.
package sandbox

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/coderoster/code-executor/internal/contracts"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/strslice"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

// Config bundles the limits applied to every spawned container.
type Config struct {
	PythonImage        string
	PHPImage           string
	TimeoutMs          int
	// ImagePullTimeoutMs bounds Docker pull + stream drain only. Must exceed
	// EXECUTION_TIMEOUT_MS: cold pulls use a separate deadline so fetching a layer
	// cannot hit the sandbox wall clock (fixes "pull stream: context deadline exceeded").
	ImagePullTimeoutMs int
	MemoryMB           int64
	CPUs               float64
	PidsLimit          int64
	TmpfsBytes         int64
}

// Runner orchestrates one container per execution.
type Runner struct {
	docker        *client.Client
	config        Config
	pulledImages  sync.Map // image ref → struct{} once successfully present locally
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

// ensureImage checks if the image exists locally; if not, pulls from the
// configured registry. Subsequent calls for the same ref short-circuit via
// the in-memory cache so we only pay the round-trip on cold start.
// Pull/stream drain uses ImagePullTimeoutMs, not execution timeout ctx.
func (r *Runner) ensureImage(execCtx context.Context, ref string) error {
	if _, cached := r.pulledImages.Load(ref); cached {
		return nil
	}
	if _, _, err := r.docker.ImageInspectWithRaw(execCtx, ref); err == nil {
		r.pulledImages.Store(ref, struct{}{})
		return nil
	}
	ms := r.config.ImagePullTimeoutMs
	if ms <= 0 {
		ms = 900000
	}
	pullCtx, cancel := context.WithTimeout(context.Background(), time.Duration(ms)*time.Millisecond)
	defer cancel()

	log.Printf("sandbox: pulling image %s", ref)
	stream, err := r.docker.ImagePull(pullCtx, ref, image.PullOptions{})
	if err != nil {
		return fmt.Errorf("image pull: %w", err)
	}
	defer stream.Close()
	if _, copyErr := io.Copy(io.Discard, stream); copyErr != nil {
		return fmt.Errorf("image pull stream: %w", copyErr)
	}
	r.pulledImages.Store(ref, struct{}{})
	return nil
}

// Run executes the code carried by `request` and returns the structured
// result (never an error — runtime failures map to a `failed` status).
//
// `mode == submit` feeds each `TestSpec.Input` as stdin in turn and grades
// the program against `TestSpec.Expected`; `mode == run` performs a single
// container run with the user code as stdin and reports a non-graded result.
func (r *Runner) Run(ctx context.Context, request contracts.ExecutionRequested) contracts.ExecutionCompleted {
	image, cmd, err := r.commandFor(request.Language)
	if err != nil {
		message := err.Error()
		return contracts.ExecutionCompleted{
			ExecutionID:  request.ExecutionID,
			Status:       "failed",
			Mode:         request.Mode,
			ErrorMessage: &message,
			TestResults:  []contracts.TestResult{},
		}
	}

	if request.Mode == contracts.ModeSubmit && len(request.Tests) > 0 {
		return r.runSubmit(ctx, request, image, cmd)
	}
	return r.runOnce(ctx, request, image, cmd)
}

func (r *Runner) runOnce(
	ctx context.Context,
	request contracts.ExecutionRequested,
	image string,
	cmd []string,
) contracts.ExecutionCompleted {
	timeout := time.Duration(r.config.TimeoutMs) * time.Millisecond
	runCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	stdout, stderr, runtimeMs, status, runErr := r.execute(runCtx, image, cmd, request.Code)

	completed := contracts.ExecutionCompleted{
		ExecutionID: request.ExecutionID,
		Status:      status,
		Mode:        contracts.ModeRun,
		Stdout:      stdout,
		Stderr:      stderr,
		RuntimeMs:   runtimeMs,
		Passed:      false,
		TestResults: []contracts.TestResult{},
	}
	if runErr != nil {
		message := runErr.Error()
		completed.ErrorMessage = &message
	}
	return completed
}

func (r *Runner) runSubmit(
	ctx context.Context,
	request contracts.ExecutionRequested,
	image string,
	cmd []string,
) contracts.ExecutionCompleted {
	timeout := time.Duration(r.config.TimeoutMs) * time.Millisecond
	results := make([]contracts.TestResult, 0, len(request.Tests))
	totalRuntimeMs := 0
	allPassed := true
	var combinedStdout strings.Builder
	var combinedStderr strings.Builder
	overallStatus := "success"

	for _, test := range request.Tests {
		runCtx, cancel := context.WithTimeout(ctx, timeout)
		// Full source piped to `python3 -` / php: may prepend stdin bootstrap so
		// `input()` / fgets see the autotest input (see buildStdin).
		program := buildStdin(request.Code, test.Input, request.Language)
		stdout, stderr, runtimeMs, status, _ := r.execute(runCtx, image, cmd, program)
		cancel()

		actual := strings.TrimRight(stdout, " \t\r\n")
		expected := strings.TrimRight(test.Expected, " \t\r\n")
		passed := status == "success" && actual == expected
		message := buildTestMessage(status, stderr, passed, expected, actual)

		expectedCopy := test.Expected
		actualCopy := actual
		var msgPtr *string
		if message != "" {
			msgPtr = &message
		}
		inputCopy := test.Input
		results = append(results, contracts.TestResult{
			Name:     test.Name,
			Passed:   passed,
			Expected: &expectedCopy,
			Actual:   &actualCopy,
			Message:  msgPtr,
			Hidden:   test.Hidden,
			Input:    inputCopy,
		})

		totalRuntimeMs += runtimeMs
		if !passed {
			allPassed = false
		}
		if status == "timeout" || status == "failed" {
			overallStatus = status
			allPassed = false
		}
		combinedStdout.WriteString(stdout)
		combinedStdout.WriteString("\n")
		combinedStderr.WriteString(stderr)
	}

	return contracts.ExecutionCompleted{
		ExecutionID: request.ExecutionID,
		Status:      overallStatus,
		Mode:        contracts.ModeSubmit,
		Stdout:      strings.TrimRight(combinedStdout.String(), "\n"),
		Stderr:      strings.TrimRight(combinedStderr.String(), "\n"),
		RuntimeMs:   totalRuntimeMs,
		Passed:      allPassed && overallStatus == "success",
		TestResults: results,
	}
}

func buildStdin(code string, testInput *string, language string) string {
	// The interpreter receives the user code via the original stdin attach.
	// When tests provide stdin, we instead concatenate code first then feed a
	// sentinel separator the program never sees — Python/PHP can read stdin
	// directly via input()/STDIN and we simulate by appending input. Because
	// the user code reads from stdin AFTER its own source has been consumed,
	// we use language-specific bootstrap that runs the code from a string
	// while preserving stdin. Simpler approach: write the user code into a
	// file inside the container is out of scope here, so we lean on the
	// language reading code from "-" stdin and inputs from a separate fd.
	//
	// As an MVP we append a NUL separator the runner translates by piping
	// only the user program; if the test provides input, we cannot pipe both
	// (interpreter would read it as more code). Instead we emit a small
	// wrapper that defines `__INPUT__` as a string and routes input() to it.
	if testInput == nil || *testInput == "" {
		return code
	}
	if language == "python" {
		return wrapPython(code, *testInput)
	}
	if language == "php" {
		return wrapPhp(code, *testInput)
	}
	return code
}

func wrapPython(userCode string, stdinPayload string) string {
	preamble := "import sys, io\nsys.stdin = io.StringIO(" + pyQuote(stdinPayload) + ")\n"
	return preamble + userCode
}

func wrapPhp(userCode string, stdinPayload string) string {
	header := strings.TrimPrefix(userCode, "<?php")
	preamble := "<?php\nfile_put_contents('php://memory', " + phpQuote(stdinPayload) + ");\n"
	preamble += "$GLOBALS['__CR_STDIN__'] = " + phpQuote(stdinPayload) + ";\n"
	return preamble + header
}

func pyQuote(value string) string {
	escaped := strings.ReplaceAll(value, "\\", "\\\\")
	escaped = strings.ReplaceAll(escaped, "\"", "\\\"")
	escaped = strings.ReplaceAll(escaped, "\n", "\\n")
	return "\"" + escaped + "\""
}

func phpQuote(value string) string {
	escaped := strings.ReplaceAll(value, "\\", "\\\\")
	escaped = strings.ReplaceAll(escaped, "'", "\\'")
	return "'" + escaped + "'"
}

func buildTestMessage(status, stderr string, passed bool, expected, actual string) string {
	if passed {
		return ""
	}
	if status == "timeout" {
		return "Превышен лимит времени"
	}
	if stderr != "" {
		trimmed := strings.TrimSpace(stderr)
		if len(trimmed) > 240 {
			trimmed = trimmed[:240] + "…"
		}
		return trimmed
	}
	return fmt.Sprintf("Ожидалось %q, получено %q", expected, actual)
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
	imageRef string,
	cmd []string,
	code string,
) (string, string, int, string, error) {
	hostCfg := r.hostConfig()
	containerCfg := &container.Config{
		Image:           imageRef,
		Cmd:             strslice.StrSlice(cmd),
		AttachStdin:     true,
		AttachStdout:    true,
		AttachStderr:    true,
		OpenStdin:       true,
		StdinOnce:       true,
		Tty:             false,
		User:            "nobody",
		WorkingDir:      "/tmp",
		NetworkDisabled: true,
	}

	if err := r.ensureImage(ctx, imageRef); err != nil {
		return "", "", 0, "failed", fmt.Errorf("ensure image: %w", err)
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
