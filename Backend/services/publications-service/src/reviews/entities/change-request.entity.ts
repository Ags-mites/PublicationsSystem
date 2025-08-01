import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChangeSeverity } from '../../common/enums/change-severity.enum';

export class ChangeRequestEntity {
  @ApiProperty({ description: 'Change request unique identifier' })
  id: string;

  @ApiProperty({ description: 'Associated review ID' })
  reviewId: string;

  @ApiProperty({ description: 'Section to be changed' })
  section: string;

  @ApiProperty({ 
    description: 'Change severity',
    enum: ChangeSeverity
  })
  severity: ChangeSeverity;

  @ApiProperty({ description: 'Description of the change needed' })
  description: string;

  @ApiPropertyOptional({ description: 'Suggested improvement' })
  suggestion?: string;

  constructor(partial: Partial<ChangeRequestEntity>) {
    Object.assign(this, partial);
  }
}