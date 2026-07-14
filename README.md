<p align="center">
  <a href="http://nestjs.com/" target="blank" title="NestJS"><img src="nestjs-svg-repo.svg" width="120" alt="Nest Logo" style="vertical-align: middle;" /></a>
</p>
<p align="center">
  <a href="https://kafka.apache.org/" target="blank" title="Apache Kafka"><img src="https://www.vectorlogo.zone/logos/apache_kafka/apache_kafka-icon.svg" width="60" alt="Kafka Logo" style="vertical-align: middle;" /></a>
  <a href="https://graphql.org/" target="blank" title="GraphQL"><img src="https://upload.wikimedia.org/wikipedia/commons/1/17/GraphQL_Logo.svg" width="60" alt="GraphQL Logo" style="vertical-align: middle;" /></a>
  <a href="https://redis.io/" target="blank" title="Redis"><img src="https://www.vectorlogo.zone/logos/redis/redis-icon.svg" width="60" alt="Redis Logo" style="vertical-align: middle;" /></a>
  <a href="https://www.postgresql.org/" target="blank" title="PostgreSQL"><img src="https://www.vectorlogo.zone/logos/postgresql/postgresql-icon.svg" width="60" alt="PostgreSQL Logo" style="vertical-align: middle;" /></a>
  <a href="https://www.mongodb.com/" target="blank" title="MongoDB"><img src="https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg" width="60" alt="MongoDB Logo" style="vertical-align: middle;" /></a>
</p>

<p align="center">
    <a href="https://typeorm.io/" target="blank" title="TypeORM"><img src="https://raw.githubusercontent.com/typeorm/typeorm/master/resources/logo_big.png" width="60" alt="TypeORM Logo" style="vertical-align: middle;" /></a>
    <a href="https://mongoosejs.com/" target="blank" title="Mongoose"><img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mongoose/mongoose.png" width="60" alt="Mongoose Logo" style="vertical-align: middle;" /></a>
    <a href="https://prometheus.io/" target="blank" title="Prometheus"><img src="https://www.vectorlogo.zone/logos/prometheusio/prometheusio-icon.svg" width="50" alt="Prometheus Logo" style="vertical-align: middle;" /></a>
    <a href="https://grafana.com/" target="blank" title="Grafana"><img src="https://www.vectorlogo.zone/logos/grafana/grafana-icon.svg" width="50" alt="Grafana Logo" style="vertical-align: middle;" /></a>
</p>




[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest


## Description

A robust NestJS backend application providing the core API for the Cloud Console ecosystem.

**Frontend Application:** [ng-console](https://github.com/SergeyDziadevich/ng-console)

**Main Features:**
- **Comprehensive API:** Support for both REST and GraphQL endpoints.
- **Authentication & Authorization:** Secure user management with JWT, Google OAuth2, Role-based Access Control (RBAC), and Two-Factor Authentication (2FA).
- **Subscription & Payment Processing:** Fully integrated with Stripe for managing premium plans, verifying checkout sessions, and securely handling Stripe webhooks (utilizing raw body parsing for cryptographic signature verification).
- **Document Storage, Sharing, Signing & Generation:** Secure file uploads to Google Cloud Storage (GCS), public sharing capabilities via generated short links, built-in PDF document signing, and dynamic PDF document generation from templates.
- **Audit Logging System:** Comprehensive audit trailing for critical user and AI Agent actions, backed by MongoDB and asynchronous Kafka streaming, featuring customizable data retention policies, live WebSocket broadcasts, and filtering.
- **Real-Time Communication:** Live chat and real-time notifications powered by Socket.IO and Redis Streams.
- **AI Integration:** AI Assistant capabilities utilizing Firebase Genkit, fully integrated with the audit logging system to track prompts, responses, and tool executions.
- **Message Broker & Asynchronous Processing:** Integrated with Apache Kafka for scalable, decoupled background tasks (e.g., distributing email notifications for support tickets).
- **Email Service:** Reusable email module for sending notifications and templates via Nodemailer, powered by a Kafka consumer architecture.
- **Support & Ticketing:** Full ticket management system for user support, utilizing Kafka to trigger asynchronous actions.
- **Multi-Database Support:** Integrated with MongoDB (Mongoose) for document storage and PostgreSQL (TypeORM) for relational data.
- **Caching & Performance:** High-performance caching layer using Redis.
- **Observability:** Prometheus integration for metrics scraping and Grafana for system monitoring and dashboards.

## Audit Logging & AI Auditing

The system features a comprehensive, asynchronous audit logging system powered by **Apache Kafka** and **MongoDB**. Critical user and system actions are tracked to maintain a complete history of system activity.

### AI Assistant Auditing
All interactions with the AI Assistant are fully audited, keeping a clear record of user queries and the agent's actions:
- **User Queries**: Automatically logged with the action `AI_ASSISTANT_PROMPT`, containing the prompt content. The `authorId` is populated with the authenticated user's identity (e.g., `username (userId)`).
- **AI Agent Responses**: Logged with the action `AI_ASSISTANT_RESPONSE` containing the agent's output, authored by `AI AGENT`.
- **Tool Invocations**: Any internal tool executed by the agent (such as fetching users, posts, tickets, or weather) generates an `AI_AGENT_TOOL_CALL` audit log showing the tool name and input parameters, authored by `AI AGENT`.
- **System Modifications**: When the AI Agent modifies data in bulk (e.g., updating ticket statuses), it logs a `TICKET_BULK_UPDATED` action under the `AI AGENT` author.

## Docker Infrastructure

This project relies on Docker Compose to run local dependencies:
- **Redis:** Used for caching and real-time streams.
- **Apache Kafka & Zookeeper:** Used for event streaming and message queues.
- **Kafka UI:** Web-based interface to monitor the Kafka cluster (available at `http://localhost:8080`).
- **Prometheus:** Collects metrics from the API (available at `http://localhost:9090`).
- **Grafana:** Visualizes metrics collected by Prometheus (available at `http://localhost:3001`, default login: `admin`/`admin`).

To start the infrastructure:
```bash
$ docker-compose up -d
```

## Project setup

```bash
$ npm install
```

## Local Development Workflow

When developing locally, it is recommended to run the API on your host machine while running the supporting infrastructure (databases, message brokers, observability tools) in Docker.

**1. Start the Infrastructure**
Start all infrastructure services *except* the API container:
```bash
$ docker-compose up -d redis zookeeper kafka kafka-ui mongo postgres prometheus grafana
```

**2. Start the API**
Run the NestJS application in watch mode on your local machine:
```bash
$ npm run start:dev
```
*Note: Prometheus is configured to successfully scrape metrics from your locally running API via `host.docker.internal`.*

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

This project uses **GitHub Actions** for automated CI/CD to **Google Cloud Platform (GCP) Compute Engine**.

The deployment workflow (`.github/workflows/deploy.yml`) is triggered automatically on pushes to the `main` branch.

### Deployment Pipeline Overview:
1. **Build & Publish:** The application is built into a Docker image and pushed to **Google Artifact Registry**.
2. **Transfer:** The `docker-compose.yml` file is securely transferred to the target GCE VM via SCP.
3. **Deploy:** The updated Docker image is pulled on the VM, and `docker compose up -d` restarts the application along with Prometheus and Grafana.


## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
