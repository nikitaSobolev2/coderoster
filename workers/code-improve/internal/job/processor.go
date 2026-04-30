package job

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/coderoster/code-improve/internal/config"
	"github.com/coderoster/code-improve/internal/openai"
	"github.com/coderoster/code-improve/internal/redisx"
	"github.com/coderoster/code-improve/internal/store"
)

const (
	maxDescRunes = 12_000
	maxCodeRunes = 50_000
	maxErrSnip   = 2000
)

type Processor struct {
	DB    *store.Pool
	AI    *openai.Client
	Redis *redisx.Client
	Cfg   config.Config
}

func (p *Processor) Run(ctx context.Context, jobID string) error {
	apiKey := strings.TrimSpace(p.Cfg.OpenAIAPIKey)
	if apiKey == "" {
		_ = p.DB.SetJobFailed(ctx, jobID, "NO_API_KEY", "missing AI_CODE_IMPROVE_API_KEY")
		_ = p.Redis.RecordFailure(ctx, p.Cfg.CircuitFailThreshold, p.Cfg.CircuitOpenSeconds)
		return nil
	}

	row, err := p.DB.LoadJob(ctx, jobID)
	if err != nil {
		return fmt.Errorf("load job: %w", err)
	}
	if row == nil {
		return nil
	}

	userCode, err := p.DB.AttemptUserCode(ctx, row.TaskID, row.UserID, row.Language)
	if err != nil {
		return fmt.Errorf("attempt: %w", err)
	}

	model := p.DB.AppImproveModel(ctx)
	if err := p.DB.SetJobStreaming(ctx, jobID); err != nil {
		return fmt.Errorf("streaming status: %w", err)
	}

	system := `Ты senior-разработчик. Улучши код ученика: безопасность, производительность, читаемость, SOLID, DRY, KISS.
Ответь строго одним JSON-объектом без markdown-обёртки, вида:
{"improvedCode":"...полный исправленный код...","explanationMarkdown":"развёрнутое объяснение на русском: что изменено, зачем, насколько лучше, что ещё можно улучшить"}`

	desc := truncateRunes(row.TaskDesc, maxDescRunes)
	code := truncateRunes(userCode, maxCodeRunes)
	userMsg := fmt.Sprintf(
		"Язык решения: %s\nКурс: %s\nКратко о курсе: %s\n\nЗадание: %s\n\nОписание задания:\n%s\n\nКод ученика:\n%s",
		row.Language, row.CourseTitle, row.CourseSummary, row.TaskTitle, desc, code,
	)

	raw, err := p.AI.ChatJSONNonStreaming(ctx, model, system, userMsg)
	if err != nil {
		_ = p.Redis.RecordFailure(ctx, p.Cfg.CircuitFailThreshold, p.Cfg.CircuitOpenSeconds)
		msg := err.Error()
		if len([]rune(msg)) > maxErrSnip {
			msg = string([]rune(msg)[:maxErrSnip])
		}
		_ = p.DB.SetJobFailed(ctx, jobID, "GENERATION_FAILED", msg)
		return nil
	}

	improved, explanation := parseModelJSON(raw, userCode)
	if err := p.DB.SetJobDone(ctx, jobID, model, improved, explanation); err != nil {
		return fmt.Errorf("done: %w", err)
	}
	_ = p.Redis.ClearFailureStreak(ctx)
	return nil
}

func parseModelJSON(raw, userCode string) (improved, explanation string) {
	var out struct {
		ImprovedCode          *string `json:"improvedCode"`
		ExplanationMarkdown   *string `json:"explanationMarkdown"`
	}
	if err := json.Unmarshal([]byte(raw), &out); err != nil || (out.ImprovedCode == nil && out.ExplanationMarkdown == nil) {
		return userCode, "Не удалось разобрать ответ модели как JSON. Сырой вывод:\n\n```\n" + truncateRunes(raw, 20_000) + "\n```"
	}
	if out.ImprovedCode != nil {
		improved = *out.ImprovedCode
	}
	if out.ExplanationMarkdown != nil {
		explanation = *out.ExplanationMarkdown
	}
	return improved, explanation
}

func truncateRunes(s string, max int) string {
	if max <= 0 {
		return s
	}
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	r := []rune(s)
	return string(r[:max])
}
