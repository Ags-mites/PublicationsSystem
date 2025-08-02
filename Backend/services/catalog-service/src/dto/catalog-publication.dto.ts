import { ApiProperty } from '@nestjs/swagger';

export class CatalogPublicationDto {
  @ApiProperty({ description: 'Publication unique identifier' })
  id: string;

  @ApiProperty({ description: 'Original publication ID from publications service' })
  originalId: string;

  @ApiProperty({ description: 'Publication title' })
  title: string;

  @ApiProperty({ description: 'Publication abstract' })
  abstract: string;

  @ApiProperty({ description: 'Publication keywords', type: [String] })
  keywords: string[];

  @ApiProperty({ description: 'Publication type (ARTICLE or BOOK)' })
  type: string;

  @ApiProperty({ description: 'Primary author name' })
  primaryAuthor: string;

  @ApiProperty({ description: 'Co-authors names', type: [String] })
  coAuthors: string[];

  @ApiProperty({ description: 'Additional metadata', type: 'object' })
  metadata: any;

  @ApiProperty({ description: 'Publication date' })
  publishedAt: Date;

  @ApiProperty({ description: 'ISBN if available', required: false })
  isbn?: string;

  @ApiProperty({ description: 'DOI if available', required: false })
  doi?: string;

  @ApiProperty({ description: 'Publication category' })
  category: string;

  @ApiProperty({ description: 'Publication license' })
  license: string;

  @ApiProperty({ description: 'Download URL if available', required: false })
  downloadUrl?: string;

  @ApiProperty({ description: 'Publication status', enum: ['ACTIVE', 'WITHDRAWN'] })
  status: string;

  @ApiProperty({ description: 'View count for popularity ranking' })
  viewCount: number;

  @ApiProperty({ description: 'When this publication was indexed in catalog' })
  indexedAt: Date;
}