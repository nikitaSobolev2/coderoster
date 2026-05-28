package sandbox

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCommandFor_ReturnsPythonImageForPython(t *testing.T) {
	r := &Runner{config: Config{PythonImage: "python:3.12-slim", PHPImage: "php:8.3-cli-alpine"}}
	image, cmd, err := r.commandFor("python")
	assert.NoError(t, err)
	assert.Equal(t, "python:3.12-slim", image)
	assert.Equal(t, []string{"python3", "-"}, cmd)
}

func TestCommandFor_ReturnsPhpImageForPhp(t *testing.T) {
	r := &Runner{config: Config{PythonImage: "py", PHPImage: "php:8.3-cli-alpine"}}
	image, cmd, err := r.commandFor("php")
	assert.NoError(t, err)
	assert.Equal(t, "php:8.3-cli-alpine", image)
	assert.Equal(t, []string{"php"}, cmd)
}

func TestCommandFor_ReturnsErrorForUnknownLanguage(t *testing.T) {
	r := &Runner{}
	_, _, err := r.commandFor("ruby")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported language")
}
