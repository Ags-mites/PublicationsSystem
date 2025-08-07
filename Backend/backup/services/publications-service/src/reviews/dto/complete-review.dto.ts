import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ReviewStatus } from '../../common/enums/review-status.enum';
export class CompleteReviewDto {
  @ApiProperty({ description: 'Final review status', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  finalStatus: ReviewStatus;
  @ApiProperty({ description: 'Final review comments' })
  @IsString()
  comments: string;
  @ApiPropertyOptional({ description: 'Final review score (1-10)', minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  score?: number;
}