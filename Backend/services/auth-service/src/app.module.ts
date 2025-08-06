import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as Joi from 'joi';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtConfigService } from './config/jwt.config';
import { DefaultUsersSeeder } from './seeds/default-users.seed';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        RABBITMQ_URL: Joi.string().required(),
        // CONSUL_HOST: Joi.string().default('localhost'), // Eliminado
        // CONSUL_PORT: Joi.number().default(8500), // Eliminado
        SERVICE_NAME: Joi.string().default('auth-service'),
        BCRYPT_ROUNDS: Joi.number().default(12),
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
  ],
  controllers: [HealthController],
  providers: [DefaultUsersSeeder],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seeder: DefaultUsersSeeder) {}

  async onModuleInit() {
    await this.seeder.seed();
  }
}