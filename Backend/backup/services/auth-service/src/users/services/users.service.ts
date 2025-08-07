import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/services/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserCreateInput, UserUpdateInput, UserEntity, RefreshTokenEntity, UserRole } from '../types/user.types';
import { User, RefreshToken } from '@prisma/client';
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}
  private mapToUserEntity(user: User): UserEntity {
    return new UserEntity({
      ...user,
      roles: user.roles as UserRole[],
    });
  }
  async create(userData: UserCreateInput): Promise<UserEntity> {
    console.log(userData)
    try {
      const user = await this.prisma.user.create({
        data: userData,
      });
      return this.mapToUserEntity(user);
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);
      throw new BadRequestException('Failed to create user');
    }
  }
  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.mapToUserEntity(user) : null;
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? this.mapToUserEntity(user) : null;
  }
  async findAll(): Promise<UserEntity[]> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return users.map(user => this.mapToUserEntity(user));
    } catch (error) {
      this.logger.error(`Error fetching all users: ${error.message}`);
      throw new BadRequestException('Failed to fetch users');
    }
  }
  async update(id: string, updateData: UserUpdateInput): Promise<UserEntity> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });
      return this.mapToUserEntity(user);
    } catch (error) {
      this.logger.error(`Error updating user ${id}: ${error.message}`);
      throw new BadRequestException('Failed to update user');
    }
  }
  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Error updating last login for user ${id}: ${error.message}`);
    }
  }
  async createRefreshToken(userId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.calculateExpirationDate(expiresIn);
    try {
      await this.prisma.refreshToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      });
      return refreshToken;
    } catch (error) {
      this.logger.error(`Error creating refresh token: ${error.message}`);
      throw new BadRequestException('Failed to create refresh token');
    }
  }
  async findRefreshToken(token: string): Promise<RefreshTokenEntity | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }
  async revokeRefreshToken(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
      await this.prisma.refreshToken.update({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    } catch (error) {
      this.logger.error(`Error revoking refresh token: ${error.message}`);
    }
  }
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    } catch (error) {
      this.logger.error(`Error revoking all refresh tokens for user ${userId}: ${error.message}`);
    }
  }
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true },
          ],
        },
      });
      this.logger.log(`Cleaned up ${result.count} expired/revoked refresh tokens`);
    } catch (error) {
      this.logger.error(`Error cleaning up tokens: ${error.message}`);
    }
  }
  private calculateExpirationDate(expiresIn: string): Date {
    const now = new Date();
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); 
    }
  }
}