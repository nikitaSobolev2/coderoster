package sandbox

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuildTestMessage_EmptyWhenPassed(t *testing.T) {
	assert.Equal(t, "", buildTestMessage("success", "", true, "x", "x"))
}

func TestBuildTestMessage_TimeoutLabelOnTimeoutStatus(t *testing.T) {
	assert.Equal(t, "Превышен лимит времени", buildTestMessage("timeout", "", false, "x", ""))
}

func TestBuildTestMessage_TrimsStderrWhenPresent(t *testing.T) {
	msg := buildTestMessage("failed", "  oops\n  ", false, "x", "")
	assert.Equal(t, "oops", msg)
}

func TestBuildTestMessage_FallsBackToExpectedActualWhenNoStderr(t *testing.T) {
	msg := buildTestMessage("failed", "", false, "x", "y")
	assert.Contains(t, msg, "Ожидалось")
	assert.Contains(t, msg, "x")
	assert.Contains(t, msg, "y")
}

func TestPyQuote_EscapesBackslashAndQuotes(t *testing.T) {
	q := pyQuote(`a"b\\c\n`)
	assert.Contains(t, q, `\"`)
}

func TestTestHasStdinBytes_DetectsNonEmptyInput(t *testing.T) {
	emptyPtr := ""
	assert.False(t, testHasStdinBytes(nil))
	assert.False(t, testHasStdinBytes(&emptyPtr))
	val := "hi"
	assert.True(t, testHasStdinBytes(&val))
}

func TestPhpDecodeToFileCmd_ProducesShellPipelineWithBase64(t *testing.T) {
	cmd := phpDecodeToFileCmd("<?php echo 'a';")
	assert.Equal(t, "/bin/sh", cmd[0])
	assert.Equal(t, "-eu", cmd[1])
	assert.Contains(t, cmd[3], "base64 -d")
}
