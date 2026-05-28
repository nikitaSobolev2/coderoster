import http from "k6/http";
import { check } from "k6";
import { USERNAMES, buildTrpcGetUrl, pick } from "./common.js";

export const options = {
  vus: 60,
  duration: "90s",
  thresholds: {
    http_req_duration: ["p(95)<250"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const username = pick(USERNAMES);
  const response = http.get(
    buildTrpcGetUrl("profile.getByUsername", { username }),
  );
  check(response, {
    "status 200": (r) => r.status === 200,
    "username echo": (r) => r.body && r.body.includes(username),
  });
}
