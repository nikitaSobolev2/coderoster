package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type JobRow struct {
	ID           string
	UserID       string
	TaskID       string
	Language     string
	TaskTitle    string
	TaskDesc     string
	CourseTitle  string
	CourseSummary string
}

type Pool struct {
	pool *pgxpool.Pool
}

func NewPool(ctx context.Context, databaseURL string) (*Pool, error) {
	p, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}
	if err := p.Ping(ctx); err != nil {
		p.Close()
		return nil, err
	}
	return &Pool{pool: p}, nil
}

func (p *Pool) Close() { p.pool.Close() }

func (p *Pool) LoadJob(ctx context.Context, jobID string) (*JobRow, error) {
	const q = `
SELECT j.id, j."userId", j."taskId", j.language,
       t.title, t.description, c.title, c.summary
FROM "AiCodeImproveJob" j
INNER JOIN "CourseTask" t ON t.id = j."taskId"
INNER JOIN "Course" c ON c.id = j."courseId"
WHERE j.id = $1
`
	var r JobRow
	err := p.pool.QueryRow(ctx, q, jobID).Scan(
		&r.ID, &r.UserID, &r.TaskID, &r.Language,
		&r.TaskTitle, &r.TaskDesc, &r.CourseTitle, &r.CourseSummary,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &r, nil
}

// AttemptUserCode mirrors legacy TS job snapshot of latest attempt userCode.
func (p *Pool) AttemptUserCode(ctx context.Context, taskID, userID, language string) (string, error) {
	const q = `SELECT "currentData"::text FROM "CourseTaskAttempt"
WHERE "courseTaskId" = $1 AND "userId" = $2`
	var raw string
	err := p.pool.QueryRow(ctx, q, taskID, userID).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	var body struct {
		Code   *string           `json:"code"`
		Drafts map[string]string `json:"drafts"`
	}
	if err := json.Unmarshal([]byte(raw), &body); err != nil {
		return "", fmt.Errorf("attempt json: %w", err)
	}
	if body.Drafts != nil {
		if c, ok := body.Drafts[language]; ok && c != "" {
			return c, nil
		}
	}
	if body.Code != nil {
		return *body.Code, nil
	}
	return "", nil
}

func (p *Pool) AppImproveModel(ctx context.Context) string {
	const q = `SELECT value::text FROM "AppSetting" WHERE key = 'ai_code_improve' LIMIT 1`
	var raw string
	err := p.pool.QueryRow(ctx, q).Scan(&raw)
	if err != nil {
		return "gpt-4o-mini"
	}
	var cfg struct {
		Model *string `json:"model"`
	}
	_ = json.Unmarshal([]byte(raw), &cfg)
	if cfg.Model != nil && strings.TrimSpace(*cfg.Model) != "" {
		return strings.TrimSpace(*cfg.Model)
	}
	return "gpt-4o-mini"
}

func (p *Pool) SetJobStreaming(ctx context.Context, jobID string) error {
	_, err := p.pool.Exec(ctx, `UPDATE "AiCodeImproveJob" SET status = 'STREAMING', "updatedAt" = NOW() WHERE id = $1`, jobID)
	return err
}

func (p *Pool) SetJobDone(ctx context.Context, jobID, model, improved, explanation string) error {
	_, err := p.pool.Exec(ctx, `
UPDATE "AiCodeImproveJob"
SET status = 'DONE', "improvedCode" = $2, "explanationMarkdown" = $3,
    "openaiModelUsed" = $4, "finishedAt" = NOW(), "errorCode" = NULL, "updatedAt" = NOW()
WHERE id = $1`,
		jobID, improved, explanation, model)
	return err
}

func (p *Pool) SetJobFailed(ctx context.Context, jobID, errCode, explanationSnippet string) error {
	_, err := p.pool.Exec(ctx, `
UPDATE "AiCodeImproveJob"
SET status = 'FAILED', "errorCode" = $2, "explanationMarkdown" = $3, "finishedAt" = NOW(), "updatedAt" = NOW()
WHERE id = $1`,
		jobID, errCode, explanationSnippet)
	return err
}
