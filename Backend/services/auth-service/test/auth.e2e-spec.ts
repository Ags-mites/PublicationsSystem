import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/services/prisma.service';
import * as bcryptjs from 'bcryptjs';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const testUser = {
    email: 'test@example.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
    affiliation: 'Test University',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();

    // Clean up test data
    await prismaService.refreshToken.deleteMany({
      where: { user: { email: testUser.email } },
    });
    await prismaService.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.refreshToken.deleteMany({
      where: { user: { email: testUser.email } },
    });
    await prismaService.user.deleteMany({
      where: { email: testUser.email },
    });
    
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.firstName).toBe(testUser.firstName);
      expect(response.body.user.lastName).toBe(testUser.lastName);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not register user with duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/auth/register')
        .send(testUser)
        .expect(409); // Conflict - duplicate email
    });

    it('should validate required fields', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // too short
        firstName: '',
        lastName: '',
      };

      await request(app.getHttpServer())
        .post('/auth/auth/register')
        .send(invalidUser)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(typeof response.body.refresh_token).toBe('string');
    });

    it('should not login with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);
    });

    it('should not login with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should validate login request body', async () => {
      await request(app.getHttpServer())
        .post('/auth/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        })
        .expect(400);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      refreshToken = loginResponse.body.refresh_token;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(typeof response.body.refresh_token).toBe('string');

      // Update refresh token for next tests
      refreshToken = response.body.refresh_token;
    });

    it('should not refresh with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/auth/refresh')
        .send({ refresh_token: 'invalid-token' })
        .expect(401);
    });

    it('should validate refresh request body', async () => {
      await request(app.getHttpServer())
        .post('/auth/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      accessToken = loginResponse.body.access_token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.firstName).toBe(testUser.firstName);
      expect(response.body.lastName).toBe(testUser.lastName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not get profile without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/auth/profile')
        .expect(401);
    });

    it('should not get profile with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/profile (PUT)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      accessToken = loginResponse.body.access_token;
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        affiliation: 'Updated University',
        biography: 'Updated biography',
      };

      const response = await request(app.getHttpServer())
        .put('/auth/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
      expect(response.body.affiliation).toBe(updateData.affiliation);
      expect(response.body.biography).toBe(updateData.biography);
    });

    it('should not update profile without token', async () => {
      await request(app.getHttpServer())
        .put('/auth/auth/profile')
        .send({ firstName: 'Test' })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      refreshToken = loginResponse.body.refresh_token;
    });

    it('should logout and revoke refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/auth/logout')
        .send({ refresh_token: refreshToken })
        .expect(200);

      // Try to use the revoked refresh token
      await request(app.getHttpServer())
        .post('/auth/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(401);
    });

    it('should validate logout request body', async () => {
      await request(app.getHttpServer())
        .post('/auth/auth/logout')
        .send({})
        .expect(400);
    });
  });

  describe('/health (GET)', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('auth-service');
    });
  });
});