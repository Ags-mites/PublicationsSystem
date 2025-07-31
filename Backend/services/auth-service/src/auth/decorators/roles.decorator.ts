import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/types/user.types';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);