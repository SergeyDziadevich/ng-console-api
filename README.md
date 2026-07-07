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
- **Audit Logging System:** Comprehensive audit trailing for critical user actions, backed by MongoDB and asynchronous Kafka streaming, featuring customizable data retention policies and filtering.
- **Real-Time Communication:** Live chat and real-time notifications powered by Socket.IO and Redis Streams.
- **AI Integration:** AI Assistant capabilities utilizing Firebase Genkit.
- **Message Broker & Asynchronous Processing:** Integrated with Apache Kafka for scalable, decoupled background tasks (e.g., distributing email notifications for support tickets).
- **Email Service:** Reusable email module for sending notifications and templates via Nodemailer, powered by a Kafka consumer architecture.
- **Support & Ticketing:** Full ticket management system for user support, utilizing Kafka to trigger asynchronous actions.
- **Multi-Database Support:** Integrated with MongoDB (Mongoose) for document storage and PostgreSQL (TypeORM) for relational data.
- **Caching & Performance:** High-performance caching layer using Redis.
- **Observability:** Prometheus integration for metrics scraping and Grafana for system monitoring and dashboards.

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
