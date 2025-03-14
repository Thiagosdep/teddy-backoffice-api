import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class UserCompanyDTO {
  @ApiProperty({
    description: 'The unique identifier of the company',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the company',
    example: 'Company Name',
  })
  name: string;

  @ApiProperty({
    description: 'The value of the company',
    example: 1000,
  })
  company_value: number;

  @ApiProperty({
    description: 'The active status of the company',
    example: true,
  })
  active: boolean;
}

/**
 * UserDTO represents the data transfer object for a user.
 */
export class UserDTO {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The remuneration of the user',
    example: 1000,
  })
  own_remuneration: number;

  @ApiProperty({
    description: 'The companies associated with the user',
    type: UserCompanyDTO,
  })
  user_companies: UserCompanyDTO[];
}

export class CreateUserDTO {
  @IsString()
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @IsEmail()
  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @IsPositive()
  @ApiProperty({
    description: 'The remuneration of the user',
    example: 1000,
  })
  own_remuneration: number;

  @IsString()
  @ApiProperty({
    description: 'The name of the company',
    example: 'Company Name',
  })
  company_name: string;

  @IsPositive()
  @ApiProperty({
    description: 'The value of the company',
    example: 1000,
  })
  company_value: number;
}

export class UpdateUserCompanyDTO {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The unique identifier of the company',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id?: string;

  @IsPositive()
  @IsOptional()
  @ApiProperty({
    description: 'The new value of the company',
    example: 1000,
  })
  company_value?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'The new active status of the company',
    example: true,
  })
  active?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The new name of the company',
    example: 'Company Name',
  })
  name?: string;
}

export class UpdateUserDTO {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The new name of the user',
    example: 'John Doe',
  })
  name?: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: 'The new email of the user',
    example: 'john.doe@example.com',
  })
  email?: string;

  @IsPositive()
  @ApiProperty({
    description: 'The new remuneration of the user',
    example: 1000,
  })
  own_remuneration?: number;

  @ValidateNested()
  @Type(() => UpdateUserCompanyDTO)
  @ApiProperty({
    description: 'The new company associated with the user',
    type: UpdateUserCompanyDTO,
    isArray: true,
  })
  user_company?: UpdateUserCompanyDTO[];
}
