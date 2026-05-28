import http from "k6/http";
import { check } from "k6";
import {
  DIFFICULTIES,
  LANGUAGES,
  SORTS,
  buildTrpcGetUrl,
  pick,
} from "./common.js";

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "2m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<400"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const input = {
    languages: [pick(LANGUAGES)],
    difficulties: [pick(DIFFICULTIES)],
    sort: pick(SORTS),
    limit: 24,
  };
  const response = http.get(buildTrpcGetUrl("course.list", input));
  check(response, {
    "status 200": (r) => r.status === 200,
    "has items payload": (r) => r.body && r.body.indexOf("items") !== -1,
  });
}
