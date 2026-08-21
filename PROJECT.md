# Project: Cloud Console Dual Monorepo Migration (Frontend MFEs + Backend Microservices)

## Architecture

### 1. Frontend Native Federation Monorepo (`/Users/dweb/angular/ng-console`)

- **Host Application**: `apps/shell` — Root Angular 22 shell containing global routing, navigation bar, top bar, dynamic MFE loader via Native Federation (`loadRemoteModule`), authentication guards, and notification listeners.
- **Remote Micro-Frontend Applications**:
  - `apps/users-mfe`: User management, roles, and profile editing.
  - `apps/tickets-mfe`: Ticket tracking, comments, priority, and kanban/list views.
  - `apps/documents-mfe`: Document management, vector embeddings, and PDF viewer.
  - `apps/payments-mfe`: Subscriptions, invoices, and payment checkout flows.
  - `apps/chat-mfe`: Real-time chat rooms and direct messaging via WebSockets.
  - `apps/ai-assistant-mfe`: AI assistant chat interface and document Q&A.
- **Shared Workspace Libraries (`libs/shared/*`)**:
  - `libs/shared/models`: Domain models, interfaces, TypeScript types (strict typing, zero `any`).
  - `libs/shared/data-access`: API client services, HTTP interceptors, state management stores with signals (`signal`, `computed`).
  - `libs/shared/ui`: Reusable UI components (buttons, badges, dialogs, form controls, data tables).
  - `libs/shared/layout`: Shell layout components (navigation, header, user menu).
  - `libs/shared/util`: Utility functions, date formatters, translation pipes, validators.
- **Micro-Frontend Federation**:
  - Utilizes `@angular-architects/native-federation` for pure ESM import map-based dynamic loading.
  - Configured with `federation.config.js` in host and remotes, sharing `@angular/core`, `@angular/common`, `@angular/router`, `rxjs`, and `@ng-console/shared/*` as singletons.

### 2. Backend Microservices Monorepo (`/Users/dweb/NestJs/ng-console-api`)

- **API Gateway**: `apps/api-gateway` — Central entry point exposing REST/GraphQL endpoints on port 3000, handling authentication, request validation, rate limiting, and routing downstream requests via TCP/Redis RPC transports.
- **Domain Microservices**:
  - `apps/auth-service`: Authentication, JWT issuance, password hashing, and user credential validation.
  - `apps/user-service`: User profiles, settings, and team memberships (MongoDB).
  - `apps/ticket-service`: Tickets, comments, epic tags, and status workflows (PostgreSQL).
  - `apps/document-service`: Document metadata, storage, vector chunking (MongoDB/GCS).
  - `apps/payment-service`: Stripe subscriptions, invoices, and webhook handling.
  - `apps/chat-service`: Real-time WebSocket gateway and chat persistence (PostgreSQL/Redis Streams).
  - `apps/notification-service`: Push/in-app notification dispatch and read states (MongoDB).
  - `apps/mailer-service`: Transactional email delivery and templates.
  - `apps/audit-service`: System audit logging and compliance records (MongoDB).
  - `apps/ai-service`: Genkit Gemini AI reasoning and RAG vector search.
  - `apps/customer-service`: Customer CRM entities and account mapping (PostgreSQL).
- **Inter-Service Communication**:
  - **Synchronous RPC**: NestJS microservices transport (`Transport.REDIS` or `Transport.TCP`) with typed message patterns defined in `libs/contracts`.
  - **Asynchronous Event Streaming**: Apache Kafka broker (`Transport.KAFKA`) for decoupled domain events (`user.created`, `ticket.assigned`, `email.notification`, `subscription.activated`, `audit-logs`).
- **Shared Backend Libraries (`libs/*`)**:
  - `libs/common`: Shared DTOs, interfaces, decorators, guards, filters, interceptors, and transport factories.
  - `libs/contracts`: Message pattern constants, event schemas, and RPC request/response payloads.
  - `libs/database`: MongoDB schema definitions and PostgreSQL TypeORM entities.

### 3. Containerization & Kubernetes Orchestration

- **Dockerfiles**:
  - Frontend: Multi-stage build with `node:24-alpine` and unprivileged Nginx (`nginxinc/nginx-unprivileged:1.27-alpine`), port 8080, custom CORS headers, ESM MIME types, zero-caching for `remoteEntry.json`.
  - Backend: Multi-stage build with `node:24-alpine`, `dumb-init` (PID 1), non-root execution (`USER node`), and modular service target build args.
- **Kubernetes Manifests**:
  - Structured Kustomize manifests under `k8s/base` and `k8s/overlays/local` & `k8s/overlays/staging`.
  - Deployments & Services for all frontend MFEs, API Gateway, and microservices.
  - Ingress-NGINX routing rules (`/api` -> API Gateway, `/socket.io` -> API Gateway/Chat, `/mfe/*` -> Remotes, `/` -> Shell).
  - ConfigMaps & Secrets for service discovery, ports, Kafka brokers, and database connection strings.
  - Supporting manifests for KRaft Kafka, Redis, PostgreSQL, and MongoDB.

---

## Feature Inventory

| #   | Feature                                  | Description                                                                                                                                                                                                                                                        | Milestone      | Source |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------ |
| 1   | Frontend Nx Monorepo Structure           | Initialize Nx workspace layout, `nx.json`, root `tsconfig.base.json`, and project structure for frontend                                                                                                                                                           | M1             | Survey |
| 2   | Frontend Shared Libraries                | Extract `libs/shared/models`, `libs/shared/data-access`, `libs/shared/ui`, `libs/shared/layout`, `libs/shared/util`                                                                                                                                                | M1             | Survey |
| 3   | Frontend Host Shell Application          | Create `apps/shell` with routing, layout, authentication guard, and dynamic MFE loader                                                                                                                                                                             | M1             | Survey |
| 4   | Frontend Remote Micro-Frontends          | Create `apps/users-mfe`, `apps/tickets-mfe`, `apps/documents-mfe`, `apps/payments-mfe`, `apps/chat-mfe`, `apps/ai-assistant-mfe`                                                                                                                                   | M1             | Survey |
| 5   | Native Federation Integration            | Configure `@angular-architects/native-federation` with `federation.config.js`, `federation.manifest.json`, and shared singleton packages                                                                                                                           | M1             | Survey |
| 6   | Frontend Code Modernization              | Remove `standalone: true`, standardize `*.component.ts`, enforce `ChangeDetectionStrategy.OnPush`, zero `any`, preserve `environments/`                                                                                                                            | M1             | Survey |
| 7   | Backend Nx Monorepo Structure            | Initialize Nx workspace layout, `nx.json`, root `tsconfig.base.json`, and project structure for backend                                                                                                                                                            | M2             | Survey |
| 8   | Backend Shared Libraries                 | Extract `libs/common`, `libs/contracts`, and `libs/database` with strict typing                                                                                                                                                                                    | M2             | Survey |
| 9   | Backend API Gateway Application          | Create `apps/api-gateway` with REST/GraphQL routing, auth guard, rate limiting, and RPC client proxy                                                                                                                                                               | M2             | Survey |
| 10  | Backend Domain Microservices             | Create `apps/auth-service`, `apps/user-service`, `apps/ticket-service`, `apps/document-service`, `apps/chat-service`, `apps/payment-service`, `apps/notification-service`, `apps/mailer-service`, `apps/audit-service`, `apps/ai-service`, `apps/customer-service` | M2             | Survey |
| 11  | Synchronous RPC Transports               | Configure NestJS microservice transports (TCP/Redis) for request-response communication between API Gateway and domain services                                                                                                                                    | M2             | Survey |
| 12  | Asynchronous Kafka Event Streaming       | Implement Kafka producers and consumers for domain events (`user.created`, `ticket.assigned`, `email.notification`, `subscription.activated`, `audit-logs`)                                                                                                        | M2             | Survey |
| 13  | Multi-Stage Frontend Dockerfiles         | Create production unprivileged Nginx Dockerfile with ESM MIME types, CORS, and cache controls for shell and remotes                                                                                                                                                | M3             | Survey |
| 14  | Multi-Stage Backend Dockerfiles          | Create production lean Node.js Dockerfile with `dumb-init`, non-root user, and modular service target args                                                                                                                                                         | M3             | Survey |
| 15  | Kubernetes Base & Overlay Manifests      | Create Kustomize manifests (`k8s/base`, `k8s/overlays/local`, `k8s/overlays/staging`) with Deployments, Services, ConfigMaps, Secrets, Ingress                                                                                                                     | M3             | Survey |
| 16  | Supporting Infra K8s Manifests           | Create manifests for KRaft Kafka, Redis, PostgreSQL, and MongoDB                                                                                                                                                                                                   | M3             | Survey |
| 17  | E2E Test Infrastructure & Harness        | Build opaque-box test runner and test harness for Tiers 1-4                                                                                                                                                                                                        | M4 (E2E Track) | Survey |
| 18  | Monorepo Build, Test & Lint Verification | Verify `nx run-many -t build`, `nx run-many -t test`, `nx run-many -t lint` with zero errors across both repos                                                                                                                                                     | M4             | Survey |
| 19  | Docker & Kubernetes Dry-Run Verification | Validate Docker builds and `kubectl apply --dry-run=client -k ...`                                                                                                                                                                                                 | M4             | Survey |
| 20  | Adversarial Coverage Hardening           | Tier 5 white-box coverage audit, edge cases, failure resilience, and integrity verification                                                                                                                                                                        | M4             | Survey |

---

## Milestones

| #   | Name                                            | Scope                                                                                                                                                                                                                              | Dependencies | Status      |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| M1  | Frontend Nx & Native Federation MFEs            | Migrate `/Users/dweb/angular/ng-console` to Nx monorepo with `apps/shell`, 6 remote MFEs, 5 shared libraries, Native Federation dynamic loading, signals, OnPush, zero `any`                                                       | None         | IN_PROGRESS |
| M2  | Backend Nx & NestJS Microservices               | Migrate `/Users/dweb/NestJs/ng-console-api` to Nx monorepo with `apps/api-gateway`, 11 domain microservices, shared libraries (`libs/common`, `libs/contracts`, `libs/database`), Redis/TCP RPC, Kafka event streaming, zero `any` | None         | IN_PROGRESS |
| M3  | Containerization & Kubernetes Manifests         | Multi-stage Dockerfiles for frontend shell/remotes and backend services; Kustomize manifests (`k8s/base`, `k8s/overlays/local`, `k8s/overlays/staging`), Ingress-NGINX routing, Kafka KRaft, Redis, Postgres, Mongo                | M1, M2       | PLANNED     |
| M4  | Final Milestone: E2E Integration & Verification | Pass 100% E2E test suite (Tiers 1-4), Tier 5 adversarial coverage hardening, full `nx run-many` builds/tests/lints verification, Docker build tests, and `kubectl apply --dry-run=client` validation                               | M1, M2, M3   | PLANNED     |

---

## Interface Contracts

### 1. Frontend Remote Micro-Frontends (`@angular-architects/native-federation`)

- **Host Route Configuration**:
  ```ts
  import { loadRemoteModule } from '@angular-architects/native-federation';
  export const routes: Routes = [
    {
      path: 'users',
      loadChildren: () =>
        loadRemoteModule('users-mfe', './Routes').then((m) => m.ROUTES),
    },
    {
      path: 'tickets',
      loadChildren: () =>
        loadRemoteModule('tickets-mfe', './Routes').then((m) => m.ROUTES),
    },
    {
      path: 'documents',
      loadChildren: () =>
        loadRemoteModule('documents-mfe', './Routes').then((m) => m.ROUTES),
    },
    {
      path: 'payments',
      loadChildren: () =>
        loadRemoteModule('payments-mfe', './Routes').then((m) => m.ROUTES),
    },
    {
      path: 'chat',
      loadChildren: () =>
        loadRemoteModule('chat-mfe', './Routes').then((m) => m.ROUTES),
    },
    {
      path: 'ai-assistant',
      loadChildren: () =>
        loadRemoteModule('ai-assistant-mfe', './Routes').then((m) => m.ROUTES),
    },
  ];
  ```
- **Shared Singleton Packages**:
  - `@angular/core`, `@angular/common`, `@angular/common/http`, `@angular/router`, `@angular/forms`, `rxjs`, `@ng-console/shared/models`, `@ng-console/shared/data-access`, `@ng-console/shared/ui`, `@ng-console/shared/layout`, `@ng-console/shared/util`.

### 2. Backend RPC & Event Streaming (`libs/contracts`)

- **Message Patterns (Synchronous RPC)**:
  - `AUTH_PATTERNS`: `auth.validate_token`, `auth.login`, `auth.register`
  - `USER_PATTERNS`: `users.find_all`, `users.find_by_id`, `users.find_by_email`, `users.create`, `users.update`, `users.delete`
  - `TICKET_PATTERNS`: `tickets.find_all`, `tickets.find_by_id`, `tickets.create`, `tickets.update_status`, `tickets.assign`
  - `DOCUMENT_PATTERNS`: `documents.find_all`, `documents.upload`, `documents.search_chunks`
  - `PAYMENT_PATTERNS`: `payments.create_subscription`, `payments.get_invoices`
  - `CHAT_PATTERNS`: `chat.get_rooms`, `chat.get_messages`, `chat.send_message`
- **Kafka Topics & Event Payloads (Asynchronous Event Streaming)**:
  - Topic `user.created`: Payload `{ userId: string, email: string, name: string, role: string, timestamp: string }`
  - Topic `ticket.assigned`: Payload `{ ticketId: string, assignedTo: string, assignedBy: string, title: string, priority: string, timestamp: string }`
  - Topic `email.notification`: Payload `{ to: string, subject: string, template: string, context: Record<string, unknown> }`
  - Topic `subscription.activated`: Payload `{ customerId: string, plan: string, status: string, expiresAt: string }`
  - Topic `audit-logs`: Payload `{ action: string, actorId: string, resource: string, details: Record<string, unknown>, timestamp: string }`

---

## Code Layout

### Frontend (`/Users/dweb/angular/ng-console`)

```
/Users/dweb/angular/ng-console/
├── apps/
│   ├── shell/
│   │   ├── src/app/ (shell navigation, header, dynamic remote routes)
│   │   ├── federation.config.js
│   │   └── project.json
│   ├── users-mfe/
│   │   ├── src/app/ (user-management, profile components)
│   │   ├── federation.config.js
│   │   └── project.json
│   ├── tickets-mfe/
│   ├── documents-mfe/
│   ├── payments-mfe/
│   ├── chat-mfe/
│   └── ai-assistant-mfe/
├── libs/
│   └── shared/
│       ├── models/src/ (index.ts, domain interfaces)
│       ├── data-access/src/ (index.ts, API services, signal stores)
│       ├── ui/src/ (index.ts, reusable buttons, modals, badges, tables)
│       ├── layout/src/ (index.ts, topbar, sidebar, shell container)
│       └── util/src/ (index.ts, pipes, formatters, helpers)
├── k8s/ (Kubernetes manifests: base & overlays)
├── Dockerfile.frontend
├── nginx.conf
├── nx.json
├── tsconfig.base.json
└── package.json
```

### Backend (`/Users/dweb/NestJs/ng-console-api`)

```
/Users/dweb/NestJs/ng-console-api/
├── apps/
│   ├── api-gateway/
│   │   ├── src/ (controllers, RPC client proxies, auth guards, main.ts)
│   │   └── project.json
│   ├── auth-service/
│   ├── user-service/
│   ├── ticket-service/
│   ├── document-service/
│   ├── payment-service/
│   ├── chat-service/
│   ├── notification-service/
│   ├── mailer-service/
│   ├── audit-service/
│   ├── ai-service/
│   └── customer-service/
├── libs/
│   ├── common/
│   │   ├── dto/src/ (shared DTOs)
│   │   ├── interfaces/src/ (common interfaces)
│   │   ├── decorators/src/ (custom decorators)
│   │   ├── guards/src/ (auth & roles guards)
│   │   ├── filters/src/ (exception filters)
│   │   ├── interceptors/src/ (logging & transform interceptors)
│   │   └── transports/src/ (RPC & Kafka client config helpers)
│   ├── contracts/src/ (message patterns, event definitions, schemas)
│   └── database/src/ (MongoDB schemas, TypeORM entities)
├── k8s/ (Kubernetes backend manifests)
├── Dockerfile.backend
├── docker-compose.yml
├── nx.json
├── tsconfig.base.json
└── package.json
```
