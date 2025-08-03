import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateAuthorDto {
  @ApiProperty({ description: 'Author first name', example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Author last name', example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ description: 'Author email address', example: 'john.doe@university.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Author affiliation/institution', example: 'Universidad ESPE' })
  @IsString()
  @MaxLength(200)
  affiliation: string;

  @ApiPropertyOptional({ 
    description: 'ORCID identifier', 
    example: '0000-0000-0000-0000',
    pattern: '^\\d{4}-\\d{4}-\\d{4}-\\d{4}$'
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{4}-\d{4}-\d{4}$/, { 
    message: 'ORCID must be in format 0000-0000-0000-0000' 
  })
  orcid?: string;

  @ApiPropertyOptional({ 
    description: 'Author biography', 
    maxLength: 1000 
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  biography?: string;

  @ApiPropertyOptional({ 
    description: 'URL to author photo' 
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}