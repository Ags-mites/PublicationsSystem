import { ApiProperty } from '@nestjs/swagger';

export class CatalogStatisticsDto {
  @ApiProperty({ description: 'Total number of active publications' })
  totalPublications: number;

  @ApiProperty({ description: 'Total number of unique authors' })
  totalAuthors: number;

  @ApiProperty({ description: 'Total number of categories' })
  totalCategories: number;

  @ApiProperty({ description: 'Most popular categories', type: [Object] })
  popularCategories: { category: string; count: number }[];

  @ApiProperty({ description: 'Most prolific authors', type: [Object] })
  topAuthors: { authorName: string; publicationCount: number }[];

  @ApiProperty({ description: 'Publications by type', type: [Object] })
  publicationsByType: { type: string; count: number }[];

  @ApiProperty({ description: 'Recent publication trends', type: [Object] })
  recentTrends: { year: number; count: number }[];

  @ApiProperty({ description: 'Most viewed publications', type: [Object] })
  mostViewed: { title: string; viewCount: number; id: string }[];
}