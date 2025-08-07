import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  affiliation?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{4}-\d{4}-\d{4}$/, { message: 'Invalid ORCID format' })
  orcid?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  biography?: string;
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}