FROM golang:1.25-alpine AS builder
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/code-executor ./cmd/code-executor

FROM alpine:3.19
RUN addgroup -S app && adduser -S -u 1001 -G app app && \
    apk add --no-cache ca-certificates docker-cli
COPY --from=builder /out/code-executor /usr/local/bin/code-executor
USER app
ENTRYPOINT ["/usr/local/bin/code-executor"]
