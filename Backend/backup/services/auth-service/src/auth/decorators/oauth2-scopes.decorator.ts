import { SetMetadata } from '@nestjs/common';
export const OAUTH2_SCOPES_KEY = 'oauth2_scopes';
export const OAuth2Scopes = (...scopes: string[]) => SetMetadata(OAUTH2_SCOPES_KEY, scopes); 