// Package contracts mirrors the wire contracts defined in
// `app/src/shared/contracts/execution.ts`. Keep these in lockstep until
// codegen is in place.
package contracts

const (
	ExchangeName            = "coderoster.events"
	ExecutionRequestedTopic = "execution.requested"
	ExecutionCompletedTopic = "execution.completed"
	ExecutionRequestedQueue = "execution.requested"
	ExecutionCompletedQueue = "execution.completed"

	ModeRun    = "run"
	ModeSubmit = "submit"
)

// TestSpec describes one autotest carried with a submission.
// `Input` is optional stdin to pipe to the user program; `Expected` is the
// trimmed stdout it must produce.
type TestSpec struct {
	Name     string  `json:"name"`
	Input    *string `json:"input"`
	Expected string  `json:"expected"`
	Hidden   bool    `json:"hidden"`
}

// ExecutionRequested matches the Zod schema in the TS app.
type ExecutionRequested struct {
	ExecutionID string     `json:"executionId"`
	UserID      string     `json:"userId"`
	TaskID      *string    `json:"taskId"`
	Language    string     `json:"language"`
	Code        string     `json:"code"`
	Mode        string     `json:"mode"`
	Tests       []TestSpec `json:"tests"`
}

// TestResult is one entry in the execution result payload.
type TestResult struct {
	Name     string  `json:"name"`
	Passed   bool    `json:"passed"`
	Expected *string `json:"expected"`
	Actual   *string `json:"actual"`
	Message  *string `json:"message"`
}

// ExecutionCompleted is the terminal event emitted by the worker.
type ExecutionCompleted struct {
	ExecutionID  string       `json:"executionId"`
	Status       string       `json:"status"`
	Mode         string       `json:"mode"`
	Stdout       string       `json:"stdout"`
	Stderr       string       `json:"stderr"`
	RuntimeMs    int          `json:"runtimeMs"`
	Passed       bool         `json:"passed"`
	TestResults  []TestResult `json:"testResults"`
	ErrorMessage *string      `json:"errorMessage"`
}
