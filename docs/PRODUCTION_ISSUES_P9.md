# Production Readiness — Round 9

Audit findings and fixes split into sequential increments. Each increment is self-contained and leaves the test suite green.

---

## P9-1 · Quick Wins — Proxy, CORS, Compression

| #   | Severity | Issue                                                                                               |
| --- | -------- | --------------------------------------------------------------------------------------------------- |
| 1   | Critical | Trust proxy not configured — throttle and client IP are broken behind Railway's reverse proxy       |
| 8   | Medium   | `x-request-id` missing from CORS `allowedHeaders` — frontend can't send tracing header cross-origin |
| 9   | Medium   | No response compression — large list payloads sent uncompressed                                     |

**Files:** `src/main.ts`, `package.json`
**Status:** ✅ Done

---

## P9-2 · Auth Endpoint Rate Limiting

| #   | Severity | Issue                                                                                                           |
| --- | -------- | --------------------------------------------------------------------------------------------------------------- |
| 2   | Critical | `POST /auth/login`, `/register`, `/forgot-password` limited to 100 req/min (global) — trivially brute-forceable |

**Files:** `src/modules/auth/presentation/auth.controller.ts`
**Status:** ✅ Done

---

## P9-3 · Session Revocation on Password Change / Reset

| #   | Severity | Issue                                                                               |
| --- | -------- | ----------------------------------------------------------------------------------- |
| 3   | Critical | After password change or reset, all existing refresh tokens remain valid for 7 days |

**Files:** `src/modules/settings/application/use-cases/change-password.use-case.ts`, `src/modules/auth/application/use-cases/reset-password.use-case.ts`, `src/modules/settings/settings.module.ts`, `src/modules/auth/auth.module.ts`
**Status:** ✅ Done

---

## P9-4 · Refresh Token Cleanup Cron + Unit Test

| #   | Severity | Issue                                                             |
| --- | -------- | ----------------------------------------------------------------- |
| 4   | High     | Expired `RefreshToken` rows never deleted — table grows unbounded |
| 5   | High     | `RefreshTokenUseCase` has zero test coverage                      |

**Files:** `src/modules/auth/application/jobs/refresh-token-cleanup.job.ts` (new), `src/modules/auth/auth.module.ts`, `src/modules/auth/application/use-cases/refresh-token.use-case.spec.ts` (new), `package.json`
**Status:** ✅ Done

---

## P9-5 · Pagination on List Endpoints

| #   | Severity | Issue                                                             |
| --- | -------- | ----------------------------------------------------------------- |
| 7   | High     | `GET /tasks` and `GET /projects` return all records with no limit |

**Files:** `src/modules/tasks/presentation/dtos/get-tasks-query.dto.ts`, `src/modules/tasks/domain/repositories/task.repository.interface.ts`, `src/modules/tasks/infrastructure/prisma-task.repository.ts`, `src/modules/tasks/presentation/tasks.controller.ts`, `src/modules/projects/presentation/dtos/get-projects-query.dto.ts` (new), `src/modules/projects/domain/repositories/project.repository.interface.ts`, `src/modules/projects/infrastructure/prisma-project.repository.ts`, `src/modules/projects/presentation/projects.controller.ts`
**Status:** ✅ Done

---

## P9-6 · Structured JSON Logging

| #   | Severity | Issue                                                                                   |
| --- | -------- | --------------------------------------------------------------------------------------- |
| 6   | High     | No structured logging — plain-text NestJS logger unusable in production log aggregation |

**Files:** `src/main.ts`, `src/app.module.ts`, `package.json`
**Status:** ✅ Done
