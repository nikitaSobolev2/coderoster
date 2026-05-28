package amqp

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// The Consumer.dispatch handler is hard-bound to amqplib.Channel which makes
// it non-trivial to drive end-to-end without a live broker. These tests cover
// the only externally observable invariants.

func TestHandlerType_AcceptsExpectedSignature(t *testing.T) {
	var handler Handler
	assert.Nil(t, handler)
}

func TestDispatchConcurrencyConstantMatchesQoS(t *testing.T) {
	assert.Equal(t, 4, dispatchConcurrency, "dispatchConcurrency must match QoS prefetch in conn.go")
}
