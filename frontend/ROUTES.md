# Frontend API Routes

Single source of truth for every outgoing HTTP call made by the frontend. Update on every new fetch / tRPC mutation that hits the network.

> tRPC procedures are not listed here unless they map to a public REST surface. They live in `src/server/api/routers/`.

---

## POST `/api/v1/contact`

Send a contact-us message from the home page footer.

- **Used in**: [`src/features/home/components/sections/FooterSection/ContactForm/index.tsx`](src/features/home/components/sections/FooterSection/ContactForm/index.tsx)
- **Auth**: Public (no auth header)
- **Headers**: `Content-Type: application/json`

### Request body

```ts
{
  name: string,    // 1..120 chars
  email: string,   // RFC 5322
  message: string  // 1..5000 chars
}
```

### Responses

- `200 OK`
  ```ts
  { ok: true }
  ```
- `400 Bad Request` — validation failed
  ```ts
  { ok: false, error: string }
  ```
- `429 Too Many Requests` — rate limit hit
  ```ts
  { ok: false, error: string }
  ```
- `5xx` — internal failure
  ```ts
  { ok: false, error: string }
  ```

### Backend implementation status

Not yet implemented. Frontend handles all error states gracefully (shows red feedback line under the form).
