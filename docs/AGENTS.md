# AGENTS.md (Backend)

## Related Documents (CRITICAL)

This agent must follow and stay consistent with:

- BACKEND_IMPLEMENTATION.md — backend modules, schema, use cases, and flows

Rules:

- Always follow BACKEND_IMPLEMENTATION.md for implementation details
- Do not implement features outside the current increment

---

## Project

Plenario backend is a **NestJS modular monolith** designed with strong architectural boundaries and production-quality standards.

---

## Stack

- NestJS
- PostgreSQL
- Prisma
- JWT (access + refresh tokens)
- Argon2 (password hashing)

---

## Core Principles (CRITICAL)

1. Architecture first
2. Explicit boundaries
3. No fat services
4. Security by default
5. Scalable design from v1
6. Test everything meaningful

---

## Architecture Rules (CRITICAL)

### Required flow

controller → use case → repository interface → repository implementation → database

### Forbidden

- controller → Prisma directly
- controller → business logic
- giant service with mixed responsibilities
- DTOs used as domain models
- business logic inside infrastructure layer

---

## Module Structure

### Each module must follow:

module/
presentation/
application/
domain/
infrastructure/

### presentation

- controllers
- DTOs
- guards usage

### application

- use cases
- orchestration logic

### domain

- entities
- enums
- repository interfaces
- business rules

### infrastructure

- Prisma repositories
- external integrations (email, Google, etc.)

---

## Required Modules

- auth
- users
- projects
- tasks
- dashboard
- settings
- core/shared

---

## Auth Rules (CRITICAL)

### Credentials auth

- user cannot log in before email confirmation
- password must be hashed with Argon2
- password must never be stored in plain text

### Email confirmation

- token must be:
  - hashed
  - expiring
  - one-time use

### Forgot password

- must NOT reveal whether email exists
- always return generic response

### Reset password

- must invalidate previous password
- token must be one-time use

### Google auth

- must be verified server-side
- must avoid duplicate users
- must safely link accounts by email when possible

---

## Ownership Rules (CRITICAL)

- every entity belongs to a user
- user can access ONLY own data
- ownership must always be validated

### Response rule

- return `404` for non-owned resources (preferred)

---

## Business Rules

### Projects

- deleting a project does NOT delete tasks
- instead: `task.projectId = null`

### Tasks

Statuses:

- TODO
- IN_PROGRESS
- DONE

Rules:

- when status becomes DONE → set `completedAt`
- when leaving DONE → clear `completedAt`

---

## Validation Rules

- use DTO validation (class-validator)
- validate:
  - enums
  - input structure
  - ownership of related entities
- normalize email before processing

---

## Security Rules

- hash passwords with Argon2
- hash tokens in database
- verify external providers server-side
- do not leak sensitive data
- protect endpoints with guards

---

## Repository Rules

- repository interfaces must live in domain layer
- implementations must live in infrastructure layer
- Prisma must NOT be used outside infrastructure

---

## Use Case Rules

Use cases must:

- represent a single business action
- be explicit and readable
- orchestrate repositories and services
- not depend on framework-specific details

---

## Error Handling

### Principles

- predictable
- safe
- no sensitive leaks

### Types

- validation error
- authentication error
- business rule violation
- not found (ownership-safe)
- internal error

---

## Logging

- log errors
- log important flows (auth, critical mutations)
- never log sensitive data (passwords, tokens)

---

## Testing (CRITICAL)

All meaningful logic must be covered with tests.

### Required

- use case tests
- service tests
- repository tests (if logic exists)
- auth flow tests
- validation tests

### Focus

- business logic
- edge cases
- security behavior

### Avoid

- meaningless boilerplate tests

---

## Coding Rules

- strongly typed code
- explicit logic
- no hidden magic
- readable naming
- small focused classes
- avoid premature abstraction

---

## Increment Rule (CRITICAL)

- implement ONLY current increment
- do NOT introduce:
  - Redis
  - queues
  - notifications
  - recurring logic
  - collaboration

---

## Definition of Done

A backend task is done only if:

- code compiles
- architecture rules are respected
- business logic is correct
- ownership is validated
- security rules are followed
- tests are implemented
- edge cases are handled
- no sensitive data leaks

---

## Anti-Patterns to Avoid

- fat services
- anemic domain (no rules, only DTOs)
- direct ORM usage everywhere
- duplicated logic across modules
- silent failures
- overengineering for v1

---

## Final Rule

If unsure:

- prefer clarity over cleverness
- prefer explicit over abstract
- prefer simple over premature complexity
