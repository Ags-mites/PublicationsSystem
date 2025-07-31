import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { JwtConfigService } from '../config/jwt.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    UsersModule,
    EventsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtConfigService],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}