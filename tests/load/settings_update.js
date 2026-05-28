import http from "k6/http";
import { check } from "k6";
import { buildTrpcPostUrl, randomString } from "./common.js";

export const options = {
  vus: 30,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Requires an authenticated session cookie (`wos-session=...`). Set
 * `K6_AUTH_COOKIE` to the value collected from a logged-in browser session.
 */
const SESSION_COOKIE = __ENV.K6_AUTH_COOKIE || "";

export default function () {
  const payload = { displayName: `Load ${randomString(8)}` };
  const headers = {
    "Content-Type": "application/json",
    "idempotency-key": uuid(),
  };
  if (SESSION_COOKIE) headers["Cookie"] = `wos-session=${SESSION_COOKIE}`;

  const response = http.post(
    buildTrpcPostUrl("settings.update"),
    JSON.stringify(payload),
    {
      headers,
    },
  );
  check(response, {
    "status 2xx or 401 without cookie": (r) =>
      (r.status >= 200 && r.status < 300) ||
      (!SESSION_COOKIE && r.status === 401),
  });
}
