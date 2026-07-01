<p align="center">
  <a href="http://nestjs.com/" target="blank" title="NestJS"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" style="vertical-align: middle;" /></a>
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
</p>




[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest


## Description

A robust NestJS backend application providing the core API for the Cloud Console ecosystem.

**Frontend Application:** [ng-console](https://github.com/SergeyDziadevich/ng-console)

**Main Features:**
- **Comprehensive API:** Support for both REST and GraphQL endpoints.
- **Authentication & Authorization:** Secure user management with JWT, Google OAuth2, Role-based Access Control (RBAC), and Two-Factor Authentication (2FA).
- **Real-Time Communication:** Live chat and real-time notifications powered by Socket.IO and Redis Streams.
- **AI Integration:** AI Assistant capabilities utilizing Firebase Genkit.
- **Message Broker & Asynchronous Processing:** Integrated with Apache Kafka for scalable, decoupled background tasks (e.g., distributing email notifications for support tickets).
- **Email Service:** Reusable email module for sending notifications and templates via Nodemailer, powered by a Kafka consumer architecture.
- **Support & Ticketing:** Full ticket management system for user support, utilizing Kafka to trigger asynchronous actions.
- **Multi-Database Support:** Integrated with MongoDB (Mongoose) for document storage and PostgreSQL (TypeORM) for relational data.
- **Caching & Performance:** High-performance caching layer using Redis.

## Docker Infrastructure

This project relies on Docker Compose to run local dependencies:
- **Redis:** Used for caching and real-time streams.
- **Apache Kafka & Zookeeper:** Used for event streaming and message queues.
- **Kafka UI:** Web-based interface to monitor the Kafka cluster (available at `http://localhost:8080`).

To start the infrastructure:
```bash
$ docker-compose up -d
```

## Project setup

```bash
$ npm install
```

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

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
