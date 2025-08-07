import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export interface AuthValidationRequest {
  token: string;
  requiredPermissions?: string[];
}

export interface AuthValidationResponse {
  isValid: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
}

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);
  private client: ClientProxy;

  constructor(private configService: ConfigService) {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: this.configService.get<string>('AUTH_SERVICE_HOST', 'localhost'),
        port: this.configService.get<number>('AUTH_SERVICE_PORT', 3001),
      },
    });
  }

  async onModuleInit() {
    await this.client.connect();
    this.logger.log('Auth client service initialized');
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  /**
   * Valida un token JWT con el microservicio de autenticación
   */
  async validateToken(token: string): Promise<AuthValidationResponse> {
    try {
      const response = await firstValueFrom(
        this.client.send<AuthValidationResponse>('auth.validate_token', { token })
      );
      
      this.logger.log(`Token validation result: ${response.isValid}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to validate token: ${error.message}`);
      return {
        isValid: false,
        error: 'Authentication service unavailable',
      };
    }
  }

  /**
   * Verifica si un usuario tiene permisos específicos
   */
  async checkPermissions(token: string, requiredPermissions: string[]): Promise<AuthValidationResponse> {
    try {
      const response = await firstValueFrom(
        this.client.send<AuthValidationResponse>('auth.check_permissions', {
          token,
          requiredPermissions,
        })
      );
      
      this.logger.log(`Permission check result: ${response.isValid}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to check permissions: ${error.message}`);
      return {
        isValid: false,
        error: 'Authentication service unavailable',
      };
    }
  }

  /**
   * Obtiene información del usuario sin validar permisos
   */
  async getUserInfo(token: string): Promise<AuthValidationResponse> {
    try {
      const response = await firstValueFrom(
        this.client.send<AuthValidationResponse>('auth.get_user_info', { token })
      );
      
      this.logger.log(`User info retrieved for user: ${response.userId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to get user info: ${error.message}`);
      return {
        isValid: false,
        error: 'Authentication service unavailable',
      };
    }
  }

  /**
   * Verifica si un usuario puede realizar una acción específica
   */
  async canPerformAction(token: string, action: string, resource?: string): Promise<AuthValidationResponse> {
    try {
      const response = await firstValueFrom(
        this.client.send<AuthValidationResponse>('auth.can_perform_action', {
          token,
          action,
          resource,
        })
      );
      
      this.logger.log(`Action check result for ${action}: ${response.isValid}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to check action permission: ${error.message}`);
      return {
        isValid: false,
        error: 'Authentication service unavailable',
      };
    }
  }
} 