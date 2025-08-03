import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, MaxLength, MinLength, Matches } from 'class-validator';

export class UpdateAuthorDto {
  @ApiPropertyOptional({ description: 'Author first name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Author last name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Author email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Author affiliation/institution' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  affiliation?: string;

  @ApiPropertyOptional({ 
    description: 'ORCID identifier', 
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

  @ApiPropertyOptional({ 
    description: 'Whether the author is active' 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}