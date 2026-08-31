import type { HttpScenario } from "./http-runtime-host";
export const HTTP_SCENARIOS: readonly HttpScenario[] = [
  {
    id: "get-success",
    method: "GET",
    path: "/api/profile",
    response: {
      status: 200,
      headers: { "content-type": "application/json" },
      body: '{"name":"Ada","plan":"pro"}',
    },
  },
  {
    id: "get-not-found",
    method: "GET",
    path: "/api/missing",
    response: { status: 404, body: '{"error":"Not found"}' },
  },
  {
    id: "controlled-500",
    method: "GET",
    path: "/api/failure",
    response: { status: 500, body: '{"error":"Controlled failure"}' },
  },
  {
    id: "post-json",
    method: "POST",
    path: "/api/profile",
    bodyIncludes: '"name"',
    response: {
      status: 201,
      headers: { "content-type": "application/json" },
      body: '{"saved":true}',
    },
  },
  {
    id: "login",
    method: "POST",
    path: "/api/login",
    sequenceId: "login-profile",
    sequenceIndex: 0,
    bodyIncludes: '"email"',
    response: {
      status: 200,
      headers: { "content-type": "application/json" },
      body: '{"session":"controlled"}',
    },
  },
  {
    id: "profile-after-login",
    method: "GET",
    path: "/api/me",
    sequenceId: "login-profile",
    sequenceIndex: 1,
    response: { status: 200, body: '{"name":"Ada"}' },
  },
];
