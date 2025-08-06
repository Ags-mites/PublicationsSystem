import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/services/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../users/types/user.types';

interface DefaultUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  affiliation?: string;
}

@Injectable()
export class DefaultUsersSeeder {
  private readonly logger = new Logger(DefaultUsersSeeder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async seed(): Promise<void> {
    try {
      const defaultUsers: DefaultUser[] = [
        {
          email: 'admin@test.com',
          password: 'Admin123!',
          firstName: 'System',
          lastName: 'Administrator',
          roles: [UserRole.ROLE_ADMIN],
          affiliation: 'Universidad de las Fuerzas Armadas ESPE',
        },
        {
          email: 'editor@test.com',
          password: 'Editor123!',
          firstName: 'Editorial',
          lastName: 'Manager',
          roles: [UserRole.ROLE_EDITOR],
          affiliation: 'Universidad de las Fuerzas Armadas ESPE',
        },
        {
          email: 'author@test.com',
          password: 'Author123!',
          firstName: 'John',
          lastName: 'Author',
          roles: [UserRole.ROLE_AUTHOR],
          affiliation: 'Universidad de las Fuerzas Armadas ESPE',
        },
        {
          email: 'reviewer@test.com',
          password: 'Reviewer123!',
          firstName: 'Jane',
          lastName: 'Reviewer',
          roles: [UserRole.ROLE_REVIEWER],
          affiliation: 'Universidad de las Fuerzas Armadas ESPE',
        },
        {
          email: 'reader@test.com',
          password: 'Reader123!',
          firstName: 'Public',
          lastName: 'Reader',
          roles: [UserRole.ROLE_READER],
          affiliation: 'General Public',
        },
      ];

      const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);

      for (const defaultUser of defaultUsers) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: defaultUser.email },
        });

        if (!existingUser) {
          const password = await bcrypt.hash(defaultUser.password, saltRounds);
          
          await this.prisma.user.create({
            data: {
              firstName: defaultUser.firstName,
              lastName: defaultUser.lastName,
              email: defaultUser.email,
              password,
              roles: defaultUser.roles,
              affiliation: defaultUser.affiliation,
              isActive: true,
            },
          });

          this.logger.log(`✅ Created default user: ${defaultUser.email}`);
        } else {
          this.logger.log(`⚠️  Default user already exists: ${defaultUser.email}`);
        }
      }

      this.logger.log('✅ Default users seeding completed');
    } catch (error) {
      this.logger.error('❌ Error seeding default users', error);
    }
  }
}