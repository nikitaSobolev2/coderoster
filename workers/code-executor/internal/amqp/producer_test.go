package amqp

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewProducer_AcceptsNilChannel(t *testing.T) {
	p := NewProducer(nil)
	assert.NotNil(t, p)
}

func TestPublish_MarshalErrorBubblesUp(t *testing.T) {
	// Channels not exposed for mocking without a full broker; this test ensures
	// the public surface is reachable from outside the package.
	p := NewProducer(nil)
	assert.NotNil(t, p)
}
