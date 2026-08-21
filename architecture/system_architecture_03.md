# Cloud Console — System Architecture v3 (Micro-Frontends & Microservices)

This document describes the modern, decoupled monorepo architecture of the **Cloud Console** platform, featuring **Angular Native Federation Micro-Frontends**, **NestJS Microservices**, **Redis/TCP Synchronous RPC**, **Apache Kafka Event Streaming**, and **Kubernetes Orchestration**.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    User([End User / Browser])

    subgraph FrontendMonorepo [Frontend Monorepo (Angular v20+ & Nx)]
        Shell["Host Shell (Port 4200)<br/>@angular-architects/native-federation"]
        
        subgraph Remotes [Remote Micro-Frontends]
            mfeUser["Users MFE (:4201)"]
            mfeTicket["Tickets MFE (:4202)"]
            mfeDoc["Documents MFE (:4203)"]
            mfePay["Payments MFE (:4204)"]
            mfeChat["Chat MFE (:4205)"]
            mfeAI["AI Assistant MFE (:4206)"]
        end

        subgraph SharedFrontendLibs [Shared Frontend Libraries]
            libFModels["libs/shared/models"]
            libFData["libs/shared/data-access"]
            libFUI["libs/shared/ui"]
            libFLayout["libs/shared/layout"]
            libFUtil["libs/shared/util"]
        end

        Shell -.->|Dynamic ESM Load| mfeUser & mfeTicket & mfeDoc & mfePay & mfeChat & mfeAI
        Remotes -.->|Import| SharedFrontendLibs
    end

    User -->|HTTP / SPA| Shell

    subgraph IngressRouting [Ingress & Edge Routing]
        Ingress["Ingress-NGINX Controller"]
    end

    Shell -->|REST / HTTP Requests| Ingress
    Shell -->|WebSocket Connection| Ingress

    subgraph BackendMonorepo [Backend Monorepo (NestJS & Nx)]
        APIGateway["API Gateway (:3000)<br/>REST Proxy, JWT Guard, Rate Limiting"]
        
        subgraph Microservices [Decoupled Domain Microservices]
            sAuth["auth-service<br/>(JWT, 2FA, OAuth2)"]
            sUser["user-service<br/>(Profiles, Settings)"]
            sTicket["ticket-service<br/>(Lifecycle, Tags)"]
            sDoc["document-service<br/>(PDF, Signatures, RAG)"]
            sPay["payment-service<br/>(Stripe Checkout, Webhooks)"]
            sChat["chat-service<br/>(Messaging, Rooms)"]
            sNotif["notification-service<br/>(WS Broadcasts)"]
            sMailer["mailer-service<br/>(Nodemailer, Templates)"]
            sAudit["audit-service<br/>(Audit Trails, AI Logs)"]
            sAI["ai-service<br/>(Firebase Genkit, Embeddings)"]
            sCust["customer-service<br/>(CRM Metadata)"]
        end

        subgraph SharedBackendLibs [Shared Backend Libraries]
            libBCommon["libs/common<br/>(Guards, Interceptors, Filters)"]
            libBContracts["libs/contracts<br/>(DTOs, Patterns, Events)"]
            libBDatabase["libs/database<br/>(TypeORM & Mongoose Schemas)"]
        end

        APIGateway -.->|Import| SharedBackendLibs
        Microservices -.->|Import| SharedBackendLibs
    end

    Ingress -->|REST Requests| APIGateway
    Ingress -->|WS Proxy| sChat & sNotif

    %% Synchronous Inter-Service Communication
    APIGateway -->|TCP / Redis RPC| sAuth & sUser & sTicket & sDoc & sPay & sChat & sNotif & sAudit & sAI & sCust

    subgraph EventBroker [Event Streaming Backbone]
        Kafka["Apache Kafka Broker (KRaft Mode)"]
        KafkaTopics["Topics:<br/>• audit.logs<br/>• document.signed<br/>• notification.*<br/>• email.notification<br/>• ticket.events"]
        Kafka --- KafkaTopics
    end

    %% Event Publishing
    sAuth & sUser & sTicket & sDoc & sPay & sAI -->|Publish Events| Kafka
    
    %% Event Consumption
    Kafka -->|Consume| sAudit
    Kafka -->|Consume| sMailer
    Kafka -->|Consume| sNotif

    subgraph DataStorage [Data & Storage Layer]
        Postgres[("PostgreSQL<br/>(Relational: Users, Tickets, Payments)")]
        MongoDB[("MongoDB<br/>(Documents, Chunks, Audit Trails)")]
        RedisStore[("Redis Cluster<br/>(RPC Transports, Cache, WS Adapter)")]
        GCS[("Google Cloud Storage<br/>(PDF Artifacts & Uploads)")]
    end

    sAuth & sUser & sTicket & sPay & sCust --> Postgres
    sDoc & sAudit & sUser --> MongoDB
    sChat & sNotif & APIGateway --> RedisStore
    sDoc --> GCS

    subgraph ExternalIntegrations [Third-Party Integrations]
        Stripe["Stripe Payments API"]
        GenAI["Google GenAI / Gemini API"]
        GoogleDrive["Google Drive OAuth2 / Sync"]
        SMTP["SMTP Server"]
    end

    sPay --> Stripe
    sAI --> GenAI
    sDoc --> GoogleDrive
    sMailer --> SMTP

    subgraph ObservabilityStack [Observability & Monitoring]
        Prometheus["Prometheus (Metrics Scraping)"]
        Grafana["Grafana (Dashboards)"]
    end

    Prometheus -->|Scrape /metrics| APIGateway & Microservices
    Grafana -->|Visualize| Prometheus
```

---

## 2. Architectural Layers & Responsibilities

### 2.1. Frontend Tier: Angular Native Federation
- **Host Shell (`apps/shell`)**: Acts as the central container, authentication coordinator, and dynamic router that imports remote modules at runtime using standard browser ECMAScript modules (ESM).
- **Remote MFEs (`apps/*-mfe`)**: Fully isolated single-spa applications serving dedicated business domains (`users`, `tickets`, `documents`, `payments`, `chat`, `ai-assistant`).
- **Shared Libraries (`libs/shared/*`)**: Centralized design system components, shared models, API clients, layout shells, and common utilities.
- **Modern Paradigms**: 100% `OnPush` change detection, signal-based reactivity (`signal()`, `computed()`, `input()`, `output()`), and native control flow.

---

### 2.2. API Gateway & Routing
- **API Gateway (`apps/api-gateway`)**:
  - Single public entry point for all REST requests on port `3000`.
  - Enforces global authentication (`JwtAuthGuard`), role-based authorization (RBAC), rate limiting, and standard response transformations.
  - Translates incoming HTTP requests into internal microservice RPC calls via NestJS `ClientProxy` transports.

---

### 2.3. Domain Microservices
Each service is an independent process with dedicated responsibilities:

1. **`auth-service`**: User authentication, JWT issuance, Google OAuth2 tokens, and TOTP Two-Factor Authentication.
2. **`user-service`**: User profile lifecycle, settings, and activity posts.
3. **`ticket-service`**: Support ticket management, priority routing, tags, and comment threads.
4. **`document-service`**: PDF document generation, template rendering, digital signatures, GCS cloud storage, and RAG chunking.
5. **`payment-service`**: Stripe Checkout sessions, subscription plan upgrades, and cryptographically verified webhook event processing.
6. **`chat-service`**: Real-time room-based chat with Socket.IO and Redis stream persistence.
7. **`notification-service`**: Real-time user alert broadcasting via WebSocket namespaces.
8. **`mailer-service`**: Asynchronous transactional email dispatch using Nodemailer and Handlebars templates (`apps/mailer-service/src/templates`).
9. **`audit-service`**: High-throughput audit logging for system actions, security events, and AI agent interactions.
10. **`ai-service`**: Firebase Genkit integration, tool calling, and vector embeddings for Document RAG queries.
11. **`customer-service`**: CRM customer record management and metadata tracking.

---

### 2.4. Inter-Service Communication Patterns

```
+-------------------------------------------------------------------------+
| Synchronous RPC: API Gateway -> Microservices (TCP / Redis Transport)   |
|   • Used for low-latency queries and immediate command results          |
|   • Strictly typed message contracts via @ng-console-api/contracts      |
+-------------------------------------------------------------------------+

+-------------------------------------------------------------------------+
| Asynchronous Events: Microservices -> Kafka Topics -> Event Consumers    |
|   • Used for decoupled background workflows (Auditing, Email, Alerts)   |
|   • Key Topics: audit.logs, document.signed, email.notification         |
+-------------------------------------------------------------------------+
```

---

## 3. Storage & Infrastructure Architecture

- **PostgreSQL**: Primary relational database for transactional consistency (Users, Tickets, Customer records, Payment transactions).
- **MongoDB**: Document database optimized for unstructured/semi-structured datasets (Generated Documents, Vector Chunks, Audit Trails).
- **Redis**: Multi-purpose memory layer providing RPC message queuing, Socket.IO adapter synchronization, and cache acceleration.
- **Kubernetes & Kustomize**:
  - `k8s/base`: Reusable base manifests with Non-Root container security (`UID 1000` / `UID 101`), resource requests/limits, and liveness/readiness probes.
  - `k8s/overlays/local`: Tailored for local Kubernetes development (Minikube / Kind) with embedded Redis, Kafka KRaft, and Postgres.
  - `k8s/overlays/staging`: Production-ready overlay with autoscaling (HPA), TLS Ingress, and external managed database bindings.
