import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class BaseResponseDto<T = any> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;
  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;
  @ApiPropertyOptional({ description: 'Response message' })
  message?: string;
  @ApiPropertyOptional({ description: 'Error details' })
  error?: any;
  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string;
  @ApiPropertyOptional({ description: 'Request correlation ID' })
  correlationId?: string;
  constructor(success: boolean, data?: T, message?: string, error?: any) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
  static success<T>(data?: T, message?: string): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, message);
  }
  static error(message: string, error?: any): BaseResponseDto {
    return new BaseResponseDto(false, undefined, message, error);
  }
}