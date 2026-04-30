FROM golang:1.23-alpine AS builder
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/code-improve ./cmd/code-improve

FROM alpine:3.19
RUN addgroup -S app && adduser -S -u 1001 -G app app && \
    apk add --no-cache ca-certificates tzdata
COPY --from=builder /out/code-improve /usr/local/bin/code-improve
USER app
ENTRYPOINT ["/usr/local/bin/code-improve"]
