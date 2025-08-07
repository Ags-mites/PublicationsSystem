import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '../../common/enums/review-status.enum';
import { ChangeRequestEntity } from './change-request.entity';
export class ReviewEntity {
  @ApiProperty({ description: 'Review unique identifier' })
  id: string;
  @ApiProperty({ description: 'Associated publication ID' })
  publicationId: string;
  @ApiProperty({ description: 'Reviewer ID' })
  reviewerId: string;
  @ApiProperty({ 
    description: 'Review status',
    enum: ReviewStatus
  })
  reviewStatus: ReviewStatus;
  @ApiProperty({ description: 'Review comments' })
  comments: string;
  @ApiPropertyOptional({ 
    description: 'Review score (1-10)',
    minimum: 1,
    maximum: 10
  })
  score?: number | null;
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
  @ApiPropertyOptional({ 
    description: 'Change requests',
    type: [ChangeRequestEntity]
  })
  changeRequests?: ChangeRequestEntity[];
  constructor(partial: any) {
    Object.assign(this, partial);
  }
}