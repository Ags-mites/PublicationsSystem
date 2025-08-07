import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsUUID, IsArray, IsString, IsDateString } from 'class-validator';
import { PublicationStatus, PublicationType } from '../../common/enums';
export class PublicationFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by publication status',
    enum: PublicationStatus,
  })
  @IsOptional()
  @IsEnum(PublicationStatus)
  status?: PublicationStatus;
  @ApiPropertyOptional({
    description: 'Filter by publication type',
    enum: PublicationType,
  })
  @IsOptional()
  @IsEnum(PublicationType)
  type?: PublicationType;
  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsUUID()
  authorId?: string;
  @ApiPropertyOptional({
    description: 'Filter by keywords',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
  @ApiPropertyOptional({ description: 'Filter by title (partial match)' })
  @IsOptional()
  @IsString()
  title?: string;
  @ApiPropertyOptional({ description: 'Filter from creation date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  fromDate?: Date;
  @ApiPropertyOptional({ description: 'Filter to creation date' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  toDate?: Date;
}