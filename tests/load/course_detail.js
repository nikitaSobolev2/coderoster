import http from "k6/http";
import { check } from "k6";
import { COURSE_SLUGS, buildTrpcGetUrl, pick } from "./common.js";

export const options = {
  vus: 50,
  duration: "2m",
  thresholds: {
    "http_req_duration{cached:true}": ["p(95)<300"],
    http_req_duration: ["p(99)<800"],
  },
};

export default function () {
  const slug = pick(COURSE_SLUGS);
  const response = http.get(buildTrpcGetUrl("course.getBySlug", { slug }));
  check(response, {
    "status 200": (r) => r.status === 200,
    "response contains slug": (r) => r.body && r.body.includes(slug),
  });
}
