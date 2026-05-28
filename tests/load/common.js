/**
 * Shared k6 helpers. Inlined faker substitutes since k6 cannot import npm
 * modules; the helper still produces realistic randomised inputs.
 */

const BASE_URL = __ENV.BASE_URL || "http://app:3000";

const LANGUAGES = ["python", "php"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const SORTS = ["popular", "newest", "shortest"];
const COURSE_SLUGS = [
  "python-basics",
  "php-api-fundamentals",
  "algorithms-introduction",
];
const USERNAMES = ["codenikita", "php_pro", "algo_dasha"];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function buildTrpcGetUrl(procedure, input) {
  const encoded = encodeURIComponent(JSON.stringify(input));
  return `${BASE_URL}/api/trpc/${procedure}?input=${encoded}`;
}

function buildTrpcPostUrl(procedure) {
  return `${BASE_URL}/api/trpc/${procedure}`;
}

module.exports = {
  BASE_URL,
  LANGUAGES,
  DIFFICULTIES,
  SORTS,
  COURSE_SLUGS,
  USERNAMES,
  pick,
  randomString,
  buildTrpcGetUrl,
  buildTrpcPostUrl,
};
