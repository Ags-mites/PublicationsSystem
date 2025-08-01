import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicationStatus, PublicationType } from '@prisma/client';

export class ArticleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  publicationId: string;

  @ApiProperty()
  targetJournal: string;

  @ApiProperty()
  section: string;

  @ApiProperty({ type: [String] })
  bibliographicReferences: string[];

  @ApiProperty()
  figureCount: number;

  @ApiProperty()
  tableCount: number;
}

export class BookResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  publicationId: string;

  @ApiProperty()
  isbn: string;

  @ApiProperty()
  pageCount: number;

  @ApiProperty()
  edition: string;
}

export class PublicationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  abstract: string;

  @ApiProperty({ type: [String] })
  keywords: string[];

  @ApiProperty({ enum: PublicationStatus })
  status: PublicationStatus;

  @ApiProperty()
  currentVersion: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  primaryAuthorId: string;

  @ApiProperty({ type: [String] })
  coAuthorIds: string[];

  @ApiProperty({ enum: PublicationType })
  type: PublicationType;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiPropertyOptional({ type: ArticleResponseDto })
  article?: ArticleResponseDto;

  @ApiPropertyOptional({ type: BookResponseDto })
  book?: BookResponseDto;
}