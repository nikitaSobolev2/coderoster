FROM php:8.3-cli-alpine
RUN addgroup -S sandbox && adduser -S -u 1001 -G sandbox sandbox
USER sandbox
WORKDIR /tmp
CMD ["php"]
