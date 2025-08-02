import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { UsersService } from '../../users/services/users.service';
// import { EventPublisherService } from '../../events/services/event-publisher.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserEntity, UserRole } from '../../users/types/user.types';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface AuthResponse {
  user: Partial<UserEntity>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    // private readonly eventPublisher: EventPublisherService,
  ) { }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const password = await bcrypt.hash(registerDto.password, saltRounds);

    // Set default role if none provided
    const roles = registerDto.roles?.length
      ? registerDto.roles
      : [UserRole.ROLE_READER];

    const userData = {
      ...registerDto,
      password,
      roles,
    };

    const user = await this.usersService.create(userData);

    // Publish user registration event
    // await this.eventPublisher.publishUserRegistered({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      timestamp: new Date(),
    });

    this.logger.log(`User registered: ${user.email}`);

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Publish login event
    // await this.eventPublisher.publishUserLogin({
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    });

    this.logger.log(`User logged in: ${user.email}`);

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const storedToken = await this.usersService.findRefreshToken(refreshToken);
      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findById(storedToken.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Revoke old token and generate new ones
      await this.usersService.revokeRefreshToken(refreshToken);
      const tokens = await this.generateTokens(user);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.usersService.revokeRefreshToken(refreshToken);
    }

    // Revoke all refresh tokens for the user
    await this.usersService.revokeAllRefreshTokens(userId);

    const user = await this.usersService.findById(userId);
    if (user) {
      // await this.eventPublisher.publishUserLogout({
        userId: user.id,
        email: user.email,
        timestamp: new Date(),
      });
    }

    this.logger.log(`User logged out: ${userId}`);
  }

  async getProfile(userId: string): Promise<Partial<UserEntity>> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto): Promise<Partial<UserEntity>> {
    const updatedUser = await this.usersService.update(userId, updateData);

    // await this.eventPublisher.publishUserProfileUpdated({
      userId: updatedUser.id,
      email: updatedUser.email,
      changes: updateData,
      timestamp: new Date(),
    });

    this.logger.log(`Profile updated: ${updatedUser.email}`);

    return this.sanitizeUser(updatedUser);
  }

  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<UserEntity | null> {
    const user = await this.usersService.findById(payload.sub);
    if (user && user.isActive) {
      return user;
    }
    return null;
  }

  async introspectToken(token: string): Promise<{ active: boolean;[key: string]: any }> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      const user = await this.validateJwtPayload(payload);

      if (!user) {
        return { active: false };
      }

      return {
        active: true,
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
        exp: payload.exp,
        iat: payload.iat,
        jti: payload.jti,
      };
    } catch (error) {
      return { active: false };
    }
  }

  getJwksKeys(): { keys: any[] } {
    // In production, you would return actual public keys
    // For demonstration, returning a mock structure
    return {
      keys: [
        {
          kty: 'RSA',
          use: 'sig',
          kid: 'auth-service-key-1',
          alg: 'RS256',
          // In real implementation, include actual public key components
          n: 'mock-modulus',
          e: 'AQAB',
        },
      ],
    };
  }

  private async generateTokens(user: UserEntity): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const jti = crypto.randomUUID();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      jti,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.usersService.createRefreshToken(user.id);

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900; // 15 minutes default
    }
  }

  private sanitizeUser(user: UserEntity): Partial<UserEntity> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}