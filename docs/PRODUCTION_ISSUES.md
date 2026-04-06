# Production Readiness — Issue Tracker

Status legend: ✅ Done | 🔄 In Progress | ⏳ Pending

---

## P8-1 — Quick Wins

| #   | Issue                                                                       | Severity    | Status  |
| --- | --------------------------------------------------------------------------- | ----------- | ------- |
| 1   | Swagger `/api/docs` exposed in production                                   | 🟠 High     | ✅ Done |
| 2   | `debug` log level always on regardless of `NODE_ENV`                        | 🟡 Medium   | ✅ Done |
| 3   | `GET /health` consumes rate-limit quota (no `@SkipThrottle`)                | 🟠 High     | ✅ Done |
| 4   | `refreshToken` passed in Google OAuth redirect URL (browser history / logs) | 🔴 Critical | ✅ Done |

---

## P8-2 — Env Validation

| #   | Issue                                                                                 | Severity    | Status  |
| --- | ------------------------------------------------------------------------------------- | ----------- | ------- |
| 5   | Missing required env vars (empty JWT secrets, missing API keys) let app boot silently | 🔴 Critical | ✅ Done |

---

## P8-3 — Refresh Token Endpoint

| #   | Issue                                                                                   | Severity    | Status  |
| --- | --------------------------------------------------------------------------------------- | ----------- | ------- |
| 6   | No `POST /auth/refresh` — users permanently logged out after 15-min access token expiry | 🔴 Critical | ✅ Done |

---

## P8-4 — Token Revocation

| #   | Issue                                                                   | Severity    | Status  |
| --- | ----------------------------------------------------------------------- | ----------- | ------- |
| 7   | Logout is a no-op — refresh tokens stay valid for 7 days after logout   | 🔴 Critical | ✅ Done |
| 8   | Refresh tokens not stored server-side, cannot be rotated or invalidated | 🔴 Critical | ✅ Done |

---

## P8-5 — Observability

| #   | Issue                                                                               | Severity  | Status  |
| --- | ----------------------------------------------------------------------------------- | --------- | ------- |
| 9   | No request correlation ID — impossible to trace a specific error in production logs | 🟡 Medium | ✅ Done |

---

## P8-6 — UserSettings Seeding

| #   | Issue                                                                                             | Severity  | Status  |
| --- | ------------------------------------------------------------------------------------------------- | --------- | ------- |
| 10  | `UserSettings` row never created on registration — any future query assuming it exists will crash | 🟡 Medium | ✅ Done |
