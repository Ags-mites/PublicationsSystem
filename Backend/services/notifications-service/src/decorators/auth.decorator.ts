import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers.authorization?.replace('Bearer ', '') || 
           request.headers['x-auth-token'] ||
           request.query.token;
  },
);

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-user-id'] || 
           request.query.userId ||
           request.body?.userId;
  },
);

export const RequiredPermissions = createParamDecorator(
  (data: string[], ctx: ExecutionContext): string[] => {
    return data || [];
  },
); 