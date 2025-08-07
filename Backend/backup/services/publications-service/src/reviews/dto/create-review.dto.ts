import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChangeSeverity } from '../../common/enums/change-severity.enum';
export class CreateChangeRequestDto {
  @ApiProperty({ description: 'Section being reviewed' })
  @IsString()
  section: string;
  @ApiProperty({ description: 'Severity of the change request', enum: ChangeSeverity })
  severity: ChangeSeverity;
  @ApiProperty({ description: 'Description of the issue' })
  @IsString()
  description: string;
  @ApiPropertyOptional({ description: 'Suggested improvement' })
  @IsString()
  @IsOptional()
  suggestion?: string;
}
export class CreateReviewDto {
  @ApiProperty({ description: 'Publication ID being reviewed' })
  @IsUUID()
  publicationId: string;
  @ApiProperty({ description: 'Reviewer ID' })
  @IsUUID()
  reviewerId: string;
  @ApiProperty({ description: 'Review comments' })
  @IsString()
  comments: string;
  @ApiPropertyOptional({ description: 'Review score (1-10)', minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  score?: number;
  @ApiPropertyOptional({ description: 'Change requests', type: [CreateChangeRequestDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChangeRequestDto)
  changeRequests?: CreateChangeRequestDto[];
}