# k6 Load Tests

Run from the repo root against a running compose stack:

```bash
docker compose up -d
docker compose run --rm tests-load run /tests/load/catalog_browse.js
docker compose run --rm tests-load run /tests/load/course_detail.js
docker compose run --rm tests-load run /tests/load/execution_run.js
docker compose run --rm tests-load run /tests/load/search_global.js
docker compose run --rm tests-load run /tests/load/profile_read.js
docker compose run --rm tests-load run /tests/load/livechat_read.js
docker compose run --rm tests-load -e K6_AUTH_COOKIE="<session-cookie>" run /tests/load/settings_update.js
```

Each scenario embeds its own VU profile and `thresholds`. The shared helpers
in `common.js` produce realistic randomised inputs without depending on
`@faker-js/faker` (k6 cannot import npm modules).
