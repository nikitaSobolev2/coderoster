import http from "k6/http";
import { check } from "k6";
import { buildTrpcGetUrl, randomString } from "./common.js";

export const options = {
  vus: 80,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<350"],
    "http_req_failed{kind:5xx}": ["rate<0.001"],
  },
};

export default function () {
  const length = 3 + Math.floor(Math.random() * 5);
  const response = http.get(
    buildTrpcGetUrl("search.global", { q: randomString(length) }),
  );
  check(response, {
    "status 200": (r) => r.status === 200,
    "no 5xx": (r) => r.status < 500,
  });
}
