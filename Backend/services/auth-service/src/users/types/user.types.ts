import { Exclude } from 'class-transformer';

export enum UserRole {
  ROLE_AUTHOR = 'ROLE_AUTHOR',
  ROLE_REVIEWER = 'ROLE_REVIEWER',
  ROLE_EDITOR = 'ROLE_EDITOR',
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_READER = 'ROLE_READER',
}

export interface UserCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  roles: UserRole[];
  affiliation?: string | null;
  orcid?: string | null;
  biography?: string | null;
  profileImageUrl?: string | null;
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  affiliation?: string | null;
  orcid?: string | null;
  biography?: string | null;
  profileImageUrl?: string | null;
}

export class UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  
  @Exclude()
  passwordHash: string;
  
  roles: UserRole[];
  affiliation: string | null;
  orcid: string | null;
  biography: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

export interface RefreshTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}