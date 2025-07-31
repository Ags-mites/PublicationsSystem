import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../users/types/user.types';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'Password123!',
    description: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain uppercase, lowercase, number and special character' }
  )
  password: string;

  @ApiProperty({ 
    example: ['ROLE_AUTHOR'], 
    enum: UserRole, 
    isArray: true,
    required: false 
  })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsOptional()
  roles?: UserRole[];

  @ApiProperty({ example: 'Universidad ESPE', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  affiliation?: string;

  @ApiProperty({ example: '0000-0000-0000-0000', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{4}-\d{4}-\d{4}$/, { message: 'Invalid ORCID format' })
  orcid?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  biography?: string;
}