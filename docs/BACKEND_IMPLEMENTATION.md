# BACKEND_IMPLEMENTATION.md

## Plenario Backend Implementation Guide

This document is the canonical implementation guide for the **Plenario backend**.
It is the source of truth for backend architecture, database design, auth flows, business rules, module boundaries, testing, and incremental delivery.

It is written for AI-assisted development and must be used together with:

- `IMPLEMENTATION.md`
- `AGENTS.md`
- frontend integration expectations where relevant

This document defines:

- locked backend scope for v1
- modular monolith architecture
- module responsibilities
- database schema design
- auth and security flows
- API design direction
- DTO strategy
- use case list
- repository contracts
- testing requirements
- increment-by-increment implementation plan

---

# 1. Project Overview

## 1.1 Product

**Plenario**

## 1.2 Backend mission

Build a production-grade NestJS backend for a premium personal planning web application.

The backend must be:

- secure
- scalable
- explicit
- testable
- easy to extend
- strict about ownership and business rules

## 1.3 Core priorities

1. Strong architecture
2. Security by default
3. Incremental delivery
4. Clear module boundaries
5. Test coverage for meaningful logic

---

# 2. Locked Backend Scope for v1

## 2.1 Included in v1

### Authentication

- register with email + password
- login with email + password
- email confirmation
- resend email confirmation
- forgot password
- reset password
- Google auth
- logout
- current user session (`me`)

### Core modules

- users
- projects
- tasks
- dashboard
- settings

### Projects

- create
- list
- details
- update
- delete

### Tasks

- create
- list
- details
- update
- delete
- today view
- upcoming view
- filtering by project/status/priority

### Dashboard

- summary cards data
- today tasks preview data
- upcoming tasks preview data

### Settings

- get profile/settings
- update profile
- update timezone
- change password
- account/provider state

## 2.2 Excluded from v1

Do not introduce these early:

- Redis
- queues
- reminders
- notifications
- recurring tasks
- collaboration
- comments
- subtasks
- labels/tags
- attachments
- calendar logic
- activity log UI/API beyond internal logging
- advanced analytics
- soft-delete architecture unless later required
- microservices

---

# 3. Product Rules That Affect Backend Behavior

## 3.1 Authentication rules

1. Credentials users **cannot log in before email confirmation**.
2. Google-authenticated users are considered verified through provider identity.
3. A single user may have multiple auth methods.
4. Same-person duplicate users must be avoided when safe linking is possible.
5. Forgot password flow must not reveal whether the email exists.

## 3.2 Ownership rules

1. Every project belongs to exactly one user.
2. Every task belongs to exactly one user.
3. A task may belong to zero or one project.
4. Every protected resource access must validate ownership.

## 3.3 Project deletion rule

When a project is deleted, tasks are **not deleted**.
Instead:

- related tasks must have `projectId = null`

## 3.4 Task business rules

1. Allowed statuses:
   - `TODO`
   - `IN_PROGRESS`
   - `DONE`

2. Allowed priorities:
   - `LOW`
   - `MEDIUM`
   - `HIGH`

3. If task status becomes `DONE`, set `completedAt`.
4. If task leaves `DONE`, clear `completedAt`.

---

# 4. Backend Architecture

## 4.1 Architecture style

Use a **modular monolith** with domain-oriented boundaries.

The goal is:

- simple deployment
- clear module isolation
- future scalability without early distributed complexity

## 4.2 Required request flow

```text
controller -> use case -> repository interface -> repository implementation -> database
```

## 4.3 Hard architectural rules

### Allowed

- controllers delegate to use cases
- use cases orchestrate business logic
- repository interfaces live in domain/application boundary as appropriate
- repository implementations live in infrastructure
- external integrations are abstracted behind interfaces/services

### Forbidden

- controller -> Prisma directly
- controller -> business logic directly
- giant service handling every action in a module
- DTOs used as domain entities
- Prisma leaking outside infrastructure
- business logic hidden inside controllers or repository implementations

## 4.4 Layer responsibilities

### presentation

Contains:

- controllers
- request DTOs
- response DTOs or presenters/serializers
- guard usage
- route decorators

Must not contain:

- direct DB access
- business rules
- hidden orchestration

### application

Contains:

- use cases
- flow orchestration
- transaction coordination when needed
- interfaces to repositories/services consumption

Examples:

- register user
- login user
- confirm email
- create project
- create task
- get dashboard summary
- change password

### domain

Contains:

- entities or domain models
- enums
- repository contracts
- core business rules
- value objects if needed

### infrastructure

Contains:

- Prisma repositories
- JWT/token services
- email service implementation
- Google auth implementation adapter
- hashing helpers if isolated here by design

---

# 5. Backend Folder Structure

## 5.1 High-level structure

```text
src/
  main.ts
  app.module.ts

  core/
    auth/
    common/
    config/
    database/
    errors/
    logging/
    utils/

  modules/
    auth/
      presentation/
      application/
      domain/
      infrastructure/

    users/
      presentation/
      application/
      domain/
      infrastructure/

    projects/
      presentation/
      application/
      domain/
      infrastructure/

    tasks/
      presentation/
      application/
      domain/
      infrastructure/

    dashboard/
      presentation/
      application/
      domain/
      infrastructure/

    settings/
      presentation/
      application/
      domain/
      infrastructure/
```

## 5.2 Core folder responsibilities

### core/config

- env parsing
- configuration service abstractions
- auth and app config definitions

### core/database

- Prisma module/service
- transaction helpers if needed

### core/auth

- guards
- decorators (`CurrentUser`)
- auth-related shared utilities
- JWT strategy integration

### core/errors

- shared exception types
- global error filter or mapping helpers

### core/logging

- logging abstraction/configuration

### core/common

- shared DTO helpers
- pagination/query helpers if later needed
- base types/constants

---

# 6. Database Design

## 6.1 Database principles

- use explicit relations
- use enums where domain values are fixed
- use timestamps consistently
- index lookup-heavy fields
- hash sensitive tokens before storing
- keep schema easy to extend for future reminders/notifications

## 6.2 Prisma schema v1

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AuthProvider {
  CREDENTIALS
  GOOGLE
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model User {
  id            String                    @id @default(cuid())
  email         String                    @unique
  name          String?
  avatarUrl     String?
  emailVerified Boolean                   @default(false)
  timezone      String                    @default("UTC")
  createdAt     DateTime                  @default(now())
  updatedAt     DateTime                  @updatedAt

  authAccounts            AuthAccount[]
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens     PasswordResetToken[]
  projects                Project[]
  tasks                   Task[]
  settings                UserSettings?

  @@index([email])
}

model AuthAccount {
  id                String       @id @default(cuid())
  userId            String
  provider          AuthProvider
  providerAccountId String
  passwordHash      String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model EmailVerificationToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model Project {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  color       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks Task[]

  @@index([userId])
  @@index([createdAt])
}

model Task {
  id          String       @id @default(cuid())
  userId      String
  projectId   String?
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  completedAt DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([projectId])
  @@index([status])
  @@index([priority])
  @@index([dueDate])
  @@index([createdAt])
}

model UserSettings {
  id        String   @id @default(cuid())
  userId    String   @unique
  timezone  String   @default("UTC")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 6.3 Schema notes

### User

- `email` is unique and normalized before insert/use
- `emailVerified` applies primarily to credentials-auth flow
- `timezone` exists on user for convenience in v1; `UserSettings` may mirror it if settings separation is preferred

### AuthAccount

- a user may have multiple auth accounts
- credentials auth uses `provider = CREDENTIALS`
- Google auth uses `provider = GOOGLE`
- `providerAccountId` for credentials can be normalized email or another deterministic identifier, but using email is acceptable if consistently handled

### Token tables

- store `tokenHash`, not raw token
- `usedAt` enables one-time semantics
- expired/used tokens must be rejected

### Project

- belongs to exactly one user
- deleting project must not delete tasks

### Task

- belongs to exactly one user
- project is optional
- `dueDate` may be nullable
- `completedAt` is controlled by business logic, not arbitrary client behavior

### UserSettings

- can evolve later for preferences
- for v1 keep it minimal

---

# 7. Domain Enums and Rules

## 7.1 AuthProvider

- `CREDENTIALS`
- `GOOGLE`

## 7.2 TaskStatus

- `TODO`
- `IN_PROGRESS`
- `DONE`

## 7.3 TaskPriority

- `LOW`
- `MEDIUM`
- `HIGH`

## 7.4 Domain rules summary

- credentials login requires verified email
- forgot password must be non-enumerable
- deleting project unassigns tasks
- DONE sets `completedAt`
- non-DONE clears `completedAt`
- ownership always required for protected resources

---

# 8. Auth and Security Design

## 8.1 Auth strategy

For v1 use:

- access token
- refresh token

Recommendation:

- short-lived access token
- longer-lived refresh token

Refresh-token persistence strategy can be simple in v1, but code should be written so rotation and revocation can be improved later.

## 8.2 Password hashing

Use **Argon2**.
Never store plain-text passwords.
Never log passwords.

## 8.3 Token hashing

Verification and reset tokens must be:

- generated as secure random values
- emailed in raw form to user
- hashed before storing in DB
- compared using hashed lookup/verification strategy

## 8.4 Email normalization

Normalize email before:

- registration
- login
- provider linking checks
- lookup in forgot password

## 8.5 Google auth

Google identity must be validated server-side.
Do not trust frontend-asserted identity.

---

# 9. Detailed Auth Flows

# 9.1 Register flow

## Input

- email
- password
- optional name

## Behavior

1. Normalize email.
2. Check whether user already exists by email.
3. Reject if email already in use.
4. Hash password with Argon2.
5. Create `User` with:
   - `emailVerified = false`
   - default timezone

6. Create `AuthAccount` with:
   - `provider = CREDENTIALS`
   - `providerAccountId = normalizedEmail` or chosen deterministic credentials identifier
   - `passwordHash = argon2 hash`

7. Generate email confirmation token.
8. Store token hash in `EmailVerificationToken`.
9. Send confirmation email.
10. Return success response.

## Important response behavior

Do not log the user in after registration.
The UI must instruct user to confirm email first.

## Errors

- email already exists
- invalid payload
- unexpected persistence/email failure

---

# 9.2 Login flow

## Input

- email
- password

## Behavior

1. Normalize email.
2. Look up credentials account.
3. If not found, return generic invalid credentials error.
4. Verify password hash.
5. If password invalid, return generic invalid credentials error.
6. Load related user.
7. If `emailVerified = false`, reject with explicit business error such as `EMAIL_NOT_VERIFIED`.
8. Issue access + refresh tokens.
9. Return session payload.

## Errors

- invalid credentials
- email not verified
- internal error

---

# 9.3 Email confirmation flow

## Input

- raw token from query param or endpoint input

## Behavior

1. Hash/verify token using the chosen approach.
2. Find matching `EmailVerificationToken`.
3. Reject if not found.
4. Reject if expired.
5. Reject if already used.
6. Mark token `usedAt`.
7. Mark user `emailVerified = true`.
8. Return success.

## Optional additional behavior

- invalidate older verification tokens for same user

---

# 9.4 Resend email confirmation flow

## Input

- email or authenticated user context depending on UX/API choice

## Behavior

1. Normalize email if email-based.
2. Find credentials user/account.
3. If user not found or already verified, return safe response depending on chosen UX.
4. Generate new token.
5. Store hashed token.
6. Optionally invalidate older unused verification tokens.
7. Send email.
8. Return success.

## Notes

- apply rate limiting in delivery layer or endpoint level if feasible
- do not let endpoint be spammed without protection

---

# 9.5 Forgot password flow

## Input

- email

## Behavior

1. Normalize email.
2. Lookup credentials account by email.
3. Always return generic success-style response regardless of existence.
4. If matching credentials account exists:
   - generate reset token
   - hash token
   - store in `PasswordResetToken`
   - send reset email

## Critical rule

This flow must not reveal whether the email exists.

---

# 9.6 Reset password flow

## Input

- raw reset token
- new password

## Behavior

1. Validate password rules.
2. Hash/verify token.
3. Find reset token.
4. Reject if not found.
5. Reject if expired.
6. Reject if already used.
7. Load related credentials account.
8. Hash new password.
9. Update `passwordHash`.
10. Mark reset token `usedAt`.
11. Optionally invalidate other password reset tokens for same user.
12. Return success.

## Effects

- old password must stop working
- new password works immediately

---

# 9.7 Google auth flow

## Behavior

1. Receive callback/provider token.
2. Validate Google identity server-side.
3. Extract provider account ID and email.
4. Look for `AuthAccount(provider=GOOGLE, providerAccountId=googleSub)`.
5. If found:
   - load user
   - issue tokens
   - return session

6. If not found:
   - normalize email
   - look for existing user by email
   - if safe to link:
     - create new `AuthAccount` for GOOGLE attached to existing user
     - if user email not verified yet, may mark verified because provider is trusted

   - else:
     - create new user with `emailVerified = true`
     - create GOOGLE auth account

7. Issue tokens.
8. Return session.

## Duplicate prevention rule

Repeated Google sign-ins must not create duplicate users or duplicate linked accounts.

---

# 9.8 Logout flow

## Behavior

For v1, minimum acceptable behavior:

- client discards tokens
- server returns success

If refresh-token persistence is implemented, invalidate server-side refresh token accordingly.

---

# 9.9 Current session (`me`) flow

## Behavior

- requires authenticated request
- returns current user information needed by frontend

## Return shape should include

- id
- email
- name
- avatarUrl
- emailVerified
- timezone
- linked providers summary

---

# 10. Modules and Use Cases

# 10.1 Auth Module

## Responsibilities

- credentials auth
- Google auth
- email confirmation
- password recovery
- session endpoints

## Use cases

- `RegisterUserUseCase`
- `LoginUserUseCase`
- `ConfirmEmailUseCase`
- `ResendEmailConfirmationUseCase`
- `ForgotPasswordUseCase`
- `ResetPasswordUseCase`
- `LoginWithGoogleUseCase`
- `LogoutUserUseCase`
- `GetCurrentUserUseCase`

## Suggested repository/service contracts

- `UserRepository`
- `AuthAccountRepository`
- `EmailVerificationTokenRepository`
- `PasswordResetTokenRepository`
- `PasswordHasher`
- `TokenGenerator`
- `JwtTokenService`
- `EmailService`
- `GoogleIdentityVerifier`

---

# 10.2 Users Module

## Responsibilities

- user lookup and core user persistence
- shared user operations used by auth/settings

## Use cases

- mostly internal/shared for v1
- optional dedicated `GetUserByIdUseCase` if needed

## Repository contract

- `UserRepository`

---

# 10.3 Projects Module

## Responsibilities

- projects CRUD
- ownership-safe access

## Use cases

- `CreateProjectUseCase`
- `GetProjectsListUseCase`
- `GetProjectByIdUseCase`
- `UpdateProjectUseCase`
- `DeleteProjectUseCase`

## Repository contracts

- `ProjectRepository`
- `TaskRepository` (for unassign-on-delete behavior)

## Delete behavior

Delete project must:

1. verify ownership
2. set related tasks `projectId = null`
3. delete project

Use transaction if needed to keep behavior consistent.

---

# 10.4 Tasks Module

## Responsibilities

- tasks CRUD
- filters
- today view
- upcoming view

## Use cases

- `CreateTaskUseCase`
- `GetTasksListUseCase`
- `GetTaskByIdUseCase`
- `UpdateTaskUseCase`
- `DeleteTaskUseCase`
- `GetTodayTasksUseCase`
- `GetUpcomingTasksUseCase`

## Repository contracts

- `TaskRepository`
- `ProjectRepository` (to validate project ownership)

## Important behavior

- if `projectId` provided, ensure project belongs to current user
- enforce status/completion logic in application/domain layer

---

# 10.5 Dashboard Module

## Responsibilities

Aggregate summary data for dashboard.

## Use cases

- `GetDashboardSummaryUseCase`

## Data included

- total projects count
- open tasks count
- tasks due today count
- upcoming tasks count
- today preview tasks
- upcoming preview tasks

## Repository contracts

- `ProjectRepository`
- `TaskRepository`

---

# 10.6 Settings Module

## Responsibilities

- get user settings/profile
- update profile
- update timezone
- change password
- expose provider/account state

## Use cases

- `GetSettingsUseCase`
- `UpdateProfileUseCase`
- `ChangePasswordUseCase`

## Repository contracts

- `UserRepository`
- `UserSettingsRepository`
- `AuthAccountRepository`
- `PasswordHasher`

---

# 11. Repository Contracts

These are conceptual contracts. Exact method names may vary, but intent should remain explicit.

# 11.1 UserRepository

Suggested methods:

- `findById(id: string)`
- `findByEmail(email: string)`
- `create(data)`
- `update(id, data)`
- `markEmailVerified(userId: string)`

# 11.2 AuthAccountRepository

Suggested methods:

- `findCredentialsByEmail(email: string)`
- `findByProviderAccount(provider, providerAccountId)`
- `findProvidersByUserId(userId: string)`
- `create(data)`
- `updatePasswordHash(userId: string, passwordHash: string)`

# 11.3 EmailVerificationTokenRepository

Suggested methods:

- `create(data)`
- `findValidByTokenHash(tokenHash: string)`
- `markUsed(id: string)`
- `invalidateUnusedForUser(userId: string)` optional

# 11.4 PasswordResetTokenRepository

Suggested methods:

- `create(data)`
- `findValidByTokenHash(tokenHash: string)`
- `markUsed(id: string)`
- `invalidateUnusedForUser(userId: string)` optional

# 11.5 ProjectRepository

Suggested methods:

- `create(data)`
- `findManyByUserId(userId: string)`
- `findByIdAndUserId(id: string, userId: string)`
- `updateByIdAndUserId(id: string, userId: string, data)`
- `deleteByIdAndUserId(id: string, userId: string)`
- `countByUserId(userId: string)`

# 11.6 TaskRepository

Suggested methods:

- `create(data)`
- `findManyByUserId(userId: string, filters)`
- `findByIdAndUserId(id: string, userId: string)`
- `updateByIdAndUserId(id: string, userId: string, data)`
- `deleteByIdAndUserId(id: string, userId: string)`
- `unassignByProjectId(projectId: string, userId: string)`
- `countOpenByUserId(userId: string)`
- `countDueTodayByUserId(userId: string, timezone: string)`
- `countUpcomingByUserId(userId: string, timezone: string)`
- `findTodayByUserId(userId: string, timezone: string)`
- `findUpcomingByUserId(userId: string, timezone: string)`

# 11.7 UserSettingsRepository

Suggested methods:

- `findByUserId(userId: string)`
- `upsertByUserId(userId: string, data)`

---

# 12. DTO and API Contract Strategy

## 12.1 Principles

- validate all input at DTO boundary
- do not expose internal persistence shapes blindly
- response DTOs should be stable and frontend-oriented
- avoid leaking internal fields such as password hashes or token hashes

## 12.2 Auth DTOs

### RegisterRequestDto

- email: string
- password: string
- name?: string

### RegisterResponseDto

- message
- email
- requiresEmailConfirmation: boolean

### LoginRequestDto

- email: string
- password: string

### LoginResponseDto

- accessToken
- refreshToken
- user

### ForgotPasswordRequestDto

- email: string

### ForgotPasswordResponseDto

- message

### ResetPasswordRequestDto

- token
- newPassword

### ConfirmEmailQueryDto or RequestDto

- token

### ResendConfirmationRequestDto

- email or authenticated user context depending on route design

### MeResponseDto

- user fields
- providers summary

## 12.3 Project DTOs

### CreateProjectRequestDto

- name
- description?
- color?

### UpdateProjectRequestDto

- name?
- description?
- color?

### ProjectResponseDto

- id
- name
- description
- color
- createdAt
- updatedAt

## 12.4 Task DTOs

### CreateTaskRequestDto

- title
- description?
- status?
- priority?
- dueDate?
- projectId?

### UpdateTaskRequestDto

- title?
- description?
- status?
- priority?
- dueDate?
- projectId?

### GetTasksQueryDto

- projectId?
- status?
- priority?

### TaskResponseDto

- id
- title
- description
- status
- priority
- dueDate
- completedAt
- projectId
- projectName? optional if useful
- createdAt
- updatedAt

## 12.5 Dashboard DTOs

### DashboardSummaryResponseDto

- totalProjects
- openTasks
- tasksDueToday
- upcomingTasks
- todayTasks
- upcomingTasksPreview

## 12.6 Settings DTOs

### SettingsResponseDto

- name
- email
- avatarUrl
- timezone
- emailVerified
- providers

### UpdateProfileRequestDto

- name?
- avatarUrl?
- timezone?

### ChangePasswordRequestDto

- currentPassword
- newPassword

---

# 13. API Surface

## 13.1 Auth endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/resend-confirmation`
- `GET /auth/confirm-email`
- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/logout`
- `GET /auth/me`

## 13.2 Projects endpoints

- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

## 13.3 Tasks endpoints

- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `GET /tasks/views/today`
- `GET /tasks/views/upcoming`

## 13.4 Dashboard endpoint

- `GET /dashboard/summary`

## 13.5 Settings endpoints

- `GET /settings`
- `PATCH /settings/profile`
- `PATCH /settings/password`

---

# 14. Validation Rules

## 14.1 Shared validation

- trim strings where appropriate
- normalize email
- validate ISO date inputs
- validate enums strictly
- validate timezone as IANA timezone identifier

## 14.2 Password rules

Recommended v1 rules:

- minimum 8 characters
- at least one letter
- at least one digit

## 14.3 Project validation

- `name` required on create
- reasonable length limits
- `color` optional, validate expected format if not using fixed palette

## 14.4 Task validation

- `title` required on create
- `projectId` optional but must belong to current user if provided
- `status` and `priority` must be valid enums
- `dueDate` optional but must be valid date

## 14.5 Settings validation

- `timezone` must be valid
- `name` length-limited
- `avatarUrl` optional and valid URL if enforced

---

# 15. Error Handling Strategy

## 15.1 Principles

- safe
- predictable
- structured
- no sensitive leaks

## 15.2 Preferred categories

- validation error
- unauthorized
- forbidden-safe / not found
- conflict
- business rule violation
- internal error

## 15.3 Business errors that may be explicit

- `EMAIL_NOT_VERIFIED`
- `INVALID_CREDENTIALS`
- `INVALID_OR_EXPIRED_TOKEN`
- `CURRENT_PASSWORD_INVALID`
- `EMAIL_ALREADY_IN_USE`

## 15.4 Ownership-safe resource handling

When entity is not owned by current user, prefer returning `404`.

## 15.5 Suggested error response shape

- `code`
- `message`
- `details?`
- `timestamp?`
- `requestId?` later if added

---

# 16. Email Design

## 16.1 Required email types

- email confirmation
- password reset

## 16.2 Email requirements

- clean HTML template
- raw link fallback
- expiration note
- no sensitive data
- clear action CTA

## 16.3 Email abstraction

Use interface-based email sending.
Do not embed provider-specific SDK logic inside use cases.

Suggested contract:

- `sendEmailConfirmation(to, name, link)`
- `sendPasswordReset(to, name, link)`

---

# 17. Timezone Handling

## 17.1 Why it matters

Today/upcoming views depend on user timezone.

## 17.2 Rules

- user timezone comes from `User.timezone` or settings
- today calculation must use user timezone, not server local time
- upcoming means strictly after the end of current user day boundary

## 17.3 v1 recommendation

Implement timezone-aware date boundary utilities centrally.
Do not scatter date-boundary logic across repositories and use cases randomly.

---

# 18. Testing Requirements

## 18.1 Global rule

All meaningful backend logic must be covered with tests.

## 18.2 Required test categories

- use case tests
- service/helper tests where logic exists
- repository tests where query behavior is non-trivial
- auth flow tests
- validation tests
- ownership tests
- task business rule tests

## 18.3 Highest priority test targets

- register/login flow
- email verification behavior
- forgot/reset password behavior
- Google safe-linking behavior
- ownership restrictions
- project delete unassign behavior
- task status/completedAt behavior
- today/upcoming filtering logic
- change password behavior

## 18.4 Testing principles

- focus on behavior over implementation details
- do not write meaningless framework boilerplate tests
- keep tests readable and deterministic
- cover edge cases and security-sensitive scenarios

---

# 19. Incremental Implementation Plan

Development must be done in **increments**.
Each increment must be end-to-end meaningful and must not drag future scope forward.

# 19.1 Increment 0 — Foundation

## Goals

Set up backend foundation.

## Deliverables

- NestJS app setup
- config module/system
- Prisma integration
- PostgreSQL connection
- base folder structure
- health endpoint
- global validation
- global error filter/handler
- logging foundation

## Done criteria

- app boots successfully
- DB connects
- Prisma is configured
- architecture structure exists

---

# 19.2 Increment 1 — Auth Core

## Goals

Implement register, login, me, logout, and auth guard foundations.

## Deliverables

- register use case + endpoint
- login use case + endpoint
- me endpoint
- logout endpoint baseline
- JWT guard/strategy
- password hashing service
- token issuing service

## Done criteria

- user can register
- user cannot log in before email confirmation
- me endpoint works for authenticated user
- tests exist for auth core behavior

---

# 19.3 Increment 2 — Email Confirmation and Password Recovery

## Goals

Complete credentials auth lifecycle.

## Deliverables

- confirm email flow
- resend confirmation flow
- forgot password flow
- reset password flow
- email service abstraction

## Done criteria

- confirmation and reset flows work end-to-end
- forgot password is non-enumerable
- token semantics are secure and one-time

---

# 19.4 Increment 3 — Google Auth

## Goals

Implement Google auth and safe account linking.

## Deliverables

- Google identity verification integration
- login with Google use case
- linking logic

## Done criteria

- Google login works
- duplicate users are avoided
- tests cover safe-link scenarios

---

# 19.5 Increment 4 — Projects

## Goals

Implement projects CRUD.

## Deliverables

- create/list/get/update/delete endpoints
- ownership checks
- project repository

## Done criteria

- projects CRUD works end-to-end
- non-owned access is blocked safely

---

# 19.6 Increment 5 — Tasks

## Goals

Implement tasks CRUD and planning views.

## Deliverables

- create/list/get/update/delete endpoints
- filters
- today view
- upcoming view
- task status/completedAt rules

## Done criteria

- tasks behavior is correct
- today/upcoming logic works using timezone-aware boundaries

---

# 19.7 Increment 6 — Dashboard and Settings

## Goals

Complete v1 feature set.

## Deliverables

- dashboard summary endpoint
- settings endpoint
- update profile
- change password

## Done criteria

- dashboard data is correct
- settings flows work
- password change works securely

---

# 19.8 Increment 7 — Polish and Hardening

## Goals

Stabilize quality.

## Deliverables

- validation hardening
- error consistency pass
- test coverage hardening
- logging/security review
- deploy readiness improvements

## Done criteria

- app is stable
- critical flows fully covered
- architecture remains clean

---

# 20. Definition of Done

A backend task is done only if:

- code compiles
- architecture rules are respected
- use case boundaries are clear
- Prisma stays in infrastructure
- validation is implemented
- ownership is enforced
- security rules are followed
- tests are implemented
- edge cases are handled
- no sensitive information leaks

---

# 21. AI-Specific Instructions

## 21.1 Scope discipline

Implement only current increment scope.
Do not introduce future features early.

## 21.2 Architecture discipline

Preserve module boundaries and layer boundaries.
Do not simplify architecture by bypassing repositories or use cases.

## 21.3 Security discipline

Default to safe behavior.
If unsure, prefer stricter auth/ownership handling.

## 21.4 Testing discipline

No meaningful feature is complete without tests.

## 21.5 Simplicity rule

Prefer clarity over cleverness.
Prefer explicit flows over hidden abstractions.
Prefer simple scalable code over premature complexity.

---

# 22. Final Summary

Plenario backend must be built as a secure, testable, modular NestJS monolith with:

- strong architectural boundaries
- Prisma isolated in infrastructure
- explicit use cases
- strict ownership checks
- secure auth flows
- clear v1 scope discipline
- complete test coverage for meaningful logic

This file should be used as the primary implementation guide for the backend repository.
