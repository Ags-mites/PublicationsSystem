import { ApiProperty } from '@nestjs/swagger';

export class CatalogAuthorDto {
  @ApiProperty({ description: 'Author unique identifier' })
  id: string;

  @ApiProperty({ description: 'Original author ID from publications service' })
  originalId: string;

  @ApiProperty({ description: 'Author full name' })
  fullName: string;

  @ApiProperty({ description: 'Author affiliation' })
  affiliation: string;

  @ApiProperty({ description: 'ORCID identifier if available', required: false })
  orcid?: string;

  @ApiProperty({ description: 'Number of publications by this author' })
  publicationCount: number;

  @ApiProperty({ description: 'Date of last publication' })
  lastPublishedAt: Date;
}