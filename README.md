<p align="center">
  <a href="http://nestjs.com/" target="blank" title="NestJS"><img src="nestjs-svg-repo.svg" width="120" alt="Nest Logo" style="vertical-align: middle;" /></a>
</p>
<p align="center">
  <a href="https://kafka.apache.org/" target="blank" title="Apache Kafka"><img src="https://www.vectorlogo.zone/logos/apache_kafka/apache_kafka-icon.svg" width="60" alt="Kafka Logo" style="vertical-align: middle;" /></a>
  <a href="https://redis.io/" target="blank" title="Redis"><img src="https://www.vectorlogo.zone/logos/redis/redis-icon.svg" width="60" alt="Redis Logo" style="vertical-align: middle;" /></a>
  <a href="https://www.postgresql.org/" target="blank" title="PostgreSQL"><img src="https://www.vectorlogo.zone/logos/postgresql/postgresql-icon.svg" width="60" alt="PostgreSQL Logo" style="vertical-align: middle;" /></a>
  <a href="https://www.mongodb.com/" target="blank" title="MongoDB"><img src="https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg" width="60" alt="MongoDB Logo" style="vertical-align: middle;" /></a>
  <a href="https://kubernetes.io/" target="blank" title="Kubernetes"><img src="https://www.vectorlogo.zone/logos/kubernetes/kubernetes-icon.svg" width="60" alt="Kubernetes Logo" style="vertical-align: middle;" /></a>
</p>

# NgConsole API (Microservices Monorepo)

NgConsole API is an enterprise-grade backend platform built with **NestJS**, **Nx**, and a decoupled **Microservices Architecture**. It powers the Cloud Console ecosystem with high-throughput API Gateway routing, synchronous Redis/TCP inter-service RPC, asynchronous Kafka event streaming, and native Kubernetes deployment.

**Frontend Application:** [ng-console](https://github.com/SergeyDziadevich/ng-console)

---

## Architecture Overview

The backend repository is organized as an Nx monorepo comprising an API Gateway, 11 dedicated domain microservices, and 3 shared libraries:

```
ng-console-api/
├── apps/
│   ├── api-gateway/          # REST API Gateway & Reverse Proxy (port 3000)
│   ├── auth-service/         # JWT, 2FA, Google OAuth2 & RBAC
│   ├── user-service/         # User Profiles & Account Management
│   ├── ticket-service/       # Support Ticketing & Lifecycle
│   ├── document-service/     # Document Upload, Signing, RAG & Templates
│   ├── payment-service/      # Stripe Checkout, Subscriptions & Webhooks
│   ├── chat-service/         # Real-Time Messaging & Chat History
│   ├── notification-service/ # WebSocket Broadcasts & Alerts
│   ├── mailer-service/       # Nodemailer Email Templating
│   ├── audit-service/        # Audit Trails & AI Agent Action Logging
│   ├── ai-service/           # Firebase Genkit AI & RAG Embeddings
│   └── customer-service/     # Customer CRM & Metadata
├── libs/
│   ├── common/               # Shared Guards, Interceptors, Filters & Decorators
│   ├── contracts/            # Message Patterns, Event DTOs & Contracts
│   └── database/             # TypeORM Entities, Mongoose Schemas & Repositories
└── k8s/                      # Kubernetes Base Manifests & Kustomize Overlays
```

---

## Inter-Service Communication

1. **Synchronous RPC (Request-Response)**:
   - Utilizes NestJS Microservice transports (TCP / Redis) for fast, low-latency inter-service queries and commands.
2. **Asynchronous Event Streaming (Pub/Sub)**:
   - Apache Kafka brokers process domain events (e.g., `user.created`, `ticket.updated`, `document.signed`, `audit.logged`) with schema validation and error-handling dead-letter paths.

---

## Key Features

- **Decoupled Microservices**: 11 isolated domain microservices running independent processes.
- **Strict TypeScript**: 100% type-safe contracts with zero `any` types across all source code and test files.
- **Audit & AI Auditing**: Complete audit tracking for user events and AI assistant tool calls backed by MongoDB and Kafka.
- **Multi-Database Support**: PostgreSQL (TypeORM) for relational business domains and MongoDB (Mongoose) for document stores and audit logs.
- **Observability**: Prometheus metrics scraping (`/metrics`) and Grafana monitoring dashboards.
- **Container Security**: Multi-stage Dockerfiles running as unprivileged `USER node` (UID 1000) with `dumb-init` (PID 1).

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **Docker & Docker Compose**: For local infrastructure services (Redis, Kafka, PostgreSQL, MongoDB)

### Installation

```bash
# Install dependencies
npm install
```

### Local Infrastructure Setup

Start the local backing services via Docker Compose:

```bash
docker-compose up -d redis zookeeper kafka kafka-ui mongo postgres prometheus grafana
```

### Running Locally

```bash
# Start the API Gateway (http://localhost:3000)
npx nx serve api-gateway

# Start all microservices in watch mode
npx nx run-many -t serve
```

---

## Workspace Commands

| Command | Description |
|---|---|
| `npx nx serve api-gateway` | Start the API Gateway |
| `npx nx serve <service-name>` | Start a specific microservice (e.g., `auth-service`) |
| `npx nx run-many -t build` | Build all microservices and shared libraries |
| `npx nx run-many -t test` | Run unit tests across all workspace projects |
| `npx nx run-many -t lint` | Run ESLint across all projects |

---

## Kubernetes Deployment

Deploy the entire backend ecosystem using Kustomize:

```bash
# Build Docker image
docker build -f Dockerfile.backend -t ng-console-api:latest .

# Deploy local development overlay
kubectl apply -k k8s/overlays/local

# Deploy staging overlay
kubectl apply -k k8s/overlays/staging
```

---

## License

This project is licensed under the [MIT License](LICENSE).

