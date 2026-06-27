<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest


## Description

A robust NestJS backend application providing the core API for the Cloud Console ecosystem.

**Main Features:**
- **Comprehensive API:** Support for both REST and GraphQL endpoints.
- **Authentication & Authorization:** Secure user management with JWT, Google OAuth2, Role-based Access Control (RBAC), and Two-Factor Authentication (2FA).
- **Real-Time Communication:** Live chat and real-time notifications powered by Socket.IO and Redis Streams.
- **AI Integration:** AI Assistant capabilities utilizing Firebase Genkit.
- **Email Service:** Reusable email module for sending notifications and templates via Nodemailer.
- **Support & Ticketing:** Full ticket management system for user support.
- **Multi-Database Support:** Integrated with MongoDB (Mongoose) for document storage and PostgreSQL (TypeORM) for relational data.
- **Caching & Performance:** High-performance caching layer using Redis.

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
