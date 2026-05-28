package job

import (
	"strings"
	"testing"

	"github.com/brianvoe/gofakeit/v7"
	"github.com/stretchr/testify/assert"
)

func TestParseModelJSON_ReturnsImprovedAndExplanationOnHappyPath(t *testing.T) {
	raw := `{"improvedCode":"print('hi')","explanationMarkdown":"better"}`
	improved, explanation := parseModelJSON(raw, "print(1)")
	assert.Equal(t, "print('hi')", improved)
	assert.Equal(t, "better", explanation)
}

func TestParseModelJSON_FallsBackToOriginalCodeOnInvalidJSON(t *testing.T) {
	improved, explanation := parseModelJSON("not-json", "print(1)")
	assert.Equal(t, "print(1)", improved)
	assert.Contains(t, explanation, "Не удалось")
}

func TestParseModelJSON_HandlesPartialResponse(t *testing.T) {
	raw := `{"improvedCode":"new"}`
	improved, explanation := parseModelJSON(raw, "old")
	assert.Equal(t, "new", improved)
	assert.Equal(t, "", explanation)
}

func TestTruncateRunes_LeavesShortStringIntact(t *testing.T) {
	assert.Equal(t, "hello", truncateRunes("hello", 1000))
}

func TestTruncateRunes_TrimsByRuneNotBytes(t *testing.T) {
	gofakeit.Seed(0)
	long := strings.Repeat("ё", 100)
	out := truncateRunes(long, 10)
	assert.Equal(t, 10, len([]rune(out)))
}
