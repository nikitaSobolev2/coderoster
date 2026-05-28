import http from "k6/http";
import { check } from "k6";
import { buildTrpcPostUrl, pick } from "./common.js";

const PYTHON_SNIPPETS = [
  'print("hello")',
  "for i in range(3):\n    print(i)",
  "print(sum([1,2,3]))",
  'name = "load"\nprint(f"hi {name}")',
];

export const options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<1500"],
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

export default function () {
  const payload = {
    taskId: null,
    language: "python",
    code: pick(PYTHON_SNIPPETS),
    mode: "run",
    context: { kind: "sandbox", ref: null },
  };
  const response = http.post(
    buildTrpcPostUrl("execution.run"),
    JSON.stringify(payload),
    {
      headers: {
        "Content-Type": "application/json",
        "idempotency-key": uuid(),
      },
    },
  );
  check(response, {
    "status 200": (r) => r.status === 200,
    "executionId present": (r) => r.body && r.body.includes("executionId"),
  });
}
