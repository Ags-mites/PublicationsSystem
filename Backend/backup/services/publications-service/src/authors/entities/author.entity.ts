import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class AuthorEntity {
  @ApiProperty({ description: 'Author unique identifier' })
  id: string;
  @ApiProperty({ description: 'First name' })
  firstName: string;
  @ApiProperty({ description: 'Last name' })
  lastName: string;
  @ApiProperty({ description: 'Email address' })
  email: string;
  @ApiProperty({ description: 'Institutional affiliation' })
  affiliation: string;
  @ApiPropertyOptional({ description: 'ORCID identifier' })
  orcid?: string | null;
  @ApiPropertyOptional({ description: 'Author biography' })
  biography?: string | null;
  @ApiPropertyOptional({ description: 'Profile photo URL' })
  photoUrl?: string | null;
  @ApiProperty({ description: 'Whether the author is active' })
  isActive: boolean;
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
  constructor(partial: any) {
    Object.assign(this, partial);
  }
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}