import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OutboxStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export class OutboxEventEntity {
  @ApiProperty({ description: 'Outbox event unique identifier' })
  id: string;

  @ApiProperty({ description: 'Aggregate ID that generated the event' })
  aggregateId: string;

  @ApiProperty({ description: 'Type of aggregate (Publication, Review, etc.)' })
  aggregateType: string;

  @ApiProperty({ description: 'Type of event' })
  eventType: string;

  @ApiProperty({ 
    description: 'Event payload as JSON',
    type: 'object'
  })
  payloadJson: Record<string, any>;

  @ApiProperty({ 
    description: 'Processing status',
    enum: OutboxStatus
  })
  status: OutboxStatus;

  @ApiProperty({ description: 'Event creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Processing completion timestamp' })
  processedAt?: Date;

  @ApiProperty({ description: 'Number of retry attempts' })
  retryCount: number;

  constructor(partial: Partial<OutboxEventEntity>) {
    Object.assign(this, partial);
  }

  canRetry(): boolean {
    return this.status === OutboxStatus.FAILED && this.retryCount < 3;
  }

  markAsSent(): void {
    this.status = OutboxStatus.SENT;
    this.processedAt = new Date();
  }

  markAsFailed(): void {
    this.status = OutboxStatus.FAILED;
    this.retryCount += 1;
  }
}
