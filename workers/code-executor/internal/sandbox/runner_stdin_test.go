package sandbox

import (
	"strings"
	"testing"

	"github.com/brianvoe/gofakeit/v7"
	"github.com/coderoster/code-executor/internal/contracts"
	"github.com/stretchr/testify/assert"
)

func ptr[T any](v T) *T {
	return &v
}

func TestBuildStdin_ReturnsCodeWhenNoInput(t *testing.T) {
	code := "print(1)"
	assert.Equal(t, code, buildStdin(code, nil, "python"))
}

func TestWrapPython_PrependsSysStdinReplacement(t *testing.T) {
	wrapped := wrapPython("print(input())", "hello\n")
	assert.True(t, strings.HasPrefix(wrapped, "import sys, io\n"))
	assert.Contains(t, wrapped, "sys.stdin = io.StringIO(")
	assert.Contains(t, wrapped, "hello")
}

func TestBuildStdin_DelegatesToWrapPythonForPython(t *testing.T) {
	code := "print(input())"
	stdin := buildStdin(code, ptr("hello"), "python")
	assert.True(t, strings.HasPrefix(stdin, "import sys, io"))
	assert.Contains(t, stdin, code)
}

func TestBuildStdin_ReturnsCodeUnchangedForPhpWithInput(t *testing.T) {
	code := "<?php echo 'a';"
	assert.Equal(t, code, buildStdin(code, ptr("hello"), "php"))
}

func TestSubmitTestDockerArgs_PhpWithInput_ReturnsDecodeToFileCmd(t *testing.T) {
	gofakeit.Seed(42)
	request := contracts.ExecutionRequested{
		Language: "php",
		Code:     gofakeit.LoremIpsumSentence(5),
	}
	cmd, stdin := submitTestDockerArgs(
		request,
		[]string{"php"},
		contracts.TestSpec{Input: ptr("stdin-bytes"), Expected: "x"},
	)
	assert.Equal(t, "stdin-bytes", stdin)
	assert.GreaterOrEqual(t, len(cmd), 3)
	assert.Equal(t, "/bin/sh", cmd[0])
}

func TestStdinForRunPreview_PrefersNonHiddenTestFirst(t *testing.T) {
	req := contracts.ExecutionRequested{
		Mode: contracts.ModeRun,
		Tests: []contracts.TestSpec{
			{Name: "hidden", Hidden: true, Input: ptr("hidden")},
			{Name: "visible", Hidden: false, Input: ptr("visible")},
		},
	}
	out := stdinForRunPreview(req)
	if assert.NotNil(t, out) {
		assert.Equal(t, "visible", *out)
	}
}

func TestStdinForRunPreview_ReturnsNilForSubmitMode(t *testing.T) {
	req := contracts.ExecutionRequested{Mode: contracts.ModeSubmit}
	assert.Nil(t, stdinForRunPreview(req))
}
