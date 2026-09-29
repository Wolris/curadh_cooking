# ADR-0003 — Internal MVP web architecture and persistence

**Status:** Accepted  
**Date:** 2026-09-28

## Context

Recipe 0001 established that Curadh Cooking needs more than static recipe pages.

The internal MVP needs to support:

- goal-first discovery;
- recipe and ingredient data;
- profile/mapping context;
- equipment/settings;
- Cook Mode;
- live deviations/observations;
- Cook Run result evidence;
- recipe/variant history;
- future contextual reasoning without making external AI mandatory.

The project is internal/private first and should remain easy to run locally or on Jim's existing VPS. There is no demonstrated need for microservices, GraphQL, queues, Redis, or a separate search service.

## Decision

Use a **TypeScript modular monolith**.

### Web client

- React
- Vite
- TypeScript

### HTTP/API server

- Node.js
- Fastify
- TypeScript
- REST/JSON

### Contracts

- Zod schemas shared between web and server where useful.

### Persistence

- SQLite for the internal MVP.
- Version-controlled SQL migrations.
- Runtime database files are private and ignored by Git.
- Keep relational boundaries portable enough that a future move to MariaDB/PostgreSQL is a deliberate migration rather than a domain redesign.

### Architecture shape

Use one repository/application with clear modules around product concepts:

- recipes;
- ingredients;
- profiles/mappings;
- kitchen/equipment;
- cook runs/results.

Do not split these into separate services.

### Contextual reasoning seam

Cook Mode domain/API state must be sufficient to build a future reasoning context from:

- Recipe/Variant;
- current Cook Run;
- current step/stage;
- deviations/observations;
- Profile and mapping/override context;
- equipment/settings;
- prior result evidence.

The MVP does **not** require an external AI provider. Structured troubleshooting can use the same context first.

### Testing

- Vitest for domain/API/unit behavior.
- React Testing Library where component behavior needs isolation.
- Playwright for meaningful browser flows once the vertical slice exists.

## Why SQLite first

For the current internal MVP, SQLite provides:

- no separate database service;
- simple local development;
- easy backup/export;
- relational integrity and migration support;
- enough capacity for recipes, profiles, and Cook Run evidence.

If concurrent multi-user/shared usage later proves that SQLite is the limiting boundary, migrate persistence deliberately without changing the canonical domain concepts.

## Explicitly not selected

- no Next.js requirement;
- no serverless dependency;
- no microservices;
- no GraphQL;
- no Redis/queue;
- no external AI dependency;
- no public multi-user architecture yet.

## Consequences

- one command can eventually start the internal app locally;
- real private profile/run data lives in the runtime database, not repository fixtures;
- Recipe 0001 can seed development with non-sensitive recipe evidence;
- the first implementation can prove the core Recipe -> Cook Run -> Result loop before expanding discovery/profile intelligence.
