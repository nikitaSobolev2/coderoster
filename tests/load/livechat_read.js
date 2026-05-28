import http from "k6/http";
import { check } from "k6";
import { buildTrpcGetUrl } from "./common.js";

export const options = {
  vus: 100,
  duration: "90s",
  thresholds: {
    http_req_duration: ["p(95)<200"],
    "http_req_failed{kind:5xx}": ["count<1"],
  },
};

export default function () {
  const response = http.get(
    buildTrpcGetUrl("livechat.listMessages", { cursorOlderId: null }),
  );
  check(response, {
    "status 200": (r) => r.status === 200,
    "no 5xx": (r) => r.status < 500,
  });
}
