import { IsString, IsNotEmpty, IsArray, IsOptional, IsEnum, IsObject, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicationType } from '@prisma/client';
export class CreateArticleDto {
  @ApiProperty({ description: 'Target journal for the article' })
  @IsString()
  @IsNotEmpty()
  targetJournal: string;
  @ApiProperty({ description: 'Section of the journal' })
  @IsString()
  @IsNotEmpty()
  section: string;
  @ApiProperty({ description: 'Bibliographic references', type: [String] })
  @IsArray()
  @IsString({ each: true })
  bibliographicReferences: string[];
  @ApiProperty({ description: 'Number of figures', default: 0 })
  @IsOptional()
  figureCount?: number = 0;
  @ApiProperty({ description: 'Number of tables', default: 0 })
  @IsOptional()
  tableCount?: number = 0;
}
export class CreateBookDto {
  @ApiProperty({ description: 'ISBN of the book' })
  @IsString()
  @IsNotEmpty()
  isbn: string;
  @ApiProperty({ description: 'Number of pages' })
  @IsNotEmpty()
  pageCount: number;
  @ApiProperty({ description: 'Edition of the book' })
  @IsString()
  @IsNotEmpty()
  edition: string;
}
export class CreatePublicationDto {
  @ApiProperty({ description: 'Title of the publication' })
  @IsString()
  @IsNotEmpty()
  title: string;
  @ApiProperty({ description: 'Abstract of the publication' })
  @IsString()
  @IsNotEmpty()
  abstract: string;
  @ApiProperty({ description: 'Keywords for the publication', type: [String] })
  @IsArray()
  @IsString({ each: true })
  keywords: string[];
  @ApiProperty({ description: 'Primary author ID' })
  @IsUUID()
  primaryAuthorId: string;
  @ApiProperty({ description: 'Co-authors IDs', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  coAuthorIds: string[];
  @ApiProperty({ description: 'Type of publication', enum: PublicationType })
  @IsEnum(PublicationType)
  type: PublicationType;
  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any> = {};
  @ApiPropertyOptional({ description: 'Article details', type: CreateArticleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateArticleDto)
  article?: CreateArticleDto;
  @ApiPropertyOptional({ description: 'Book details', type: CreateBookDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBookDto)
  book?: CreateBookDto;
}