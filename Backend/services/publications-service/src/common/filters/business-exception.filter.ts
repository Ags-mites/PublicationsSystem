import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { BaseResponseDto } from '../dto/base-response.dto';

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessExceptionFilter.name);

  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = BaseResponseDto.error(
      exception.message,
      {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        correlationId: request.headers['x-correlation-id'],
      },
    );

    this.logger.warn(
      `Business Exception: ${status} - ${exception.message}`,
      `${request.method} ${request.url}`,
    );

    response.status(status).json(errorResponse);
  }
}