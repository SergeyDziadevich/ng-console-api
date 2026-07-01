import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as http from 'http';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AuthGuard } from './../src/auth/auth.guard';

describe('Cache (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true }) // Bypass auth for tests
      .compile();

    app = moduleFixture.createNestApplication();
    usersService = moduleFixture.get<UsersService>(UsersService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cache GET /users endpoint', async () => {
    const spy = jest.spyOn(usersService, 'getAllUsers').mockResolvedValue([]);

    // First request should hit the service
    await request(app.getHttpServer() as http.Server)
      .get('/users')
      .expect(200);

    expect(spy).toHaveBeenCalledTimes(1);

    // Second request should hit the cache, service should NOT be called again
    await request(app.getHttpServer() as http.Server)
      .get('/users')
      .expect(200);

    expect(spy).toHaveBeenCalledTimes(1); // Still 1
  });
});
