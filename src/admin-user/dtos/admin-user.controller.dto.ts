import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AdminLoginDTO {
  @ApiProperty({
    description: 'Admin username',
    example: 'admin',
  })
  @IsNotEmpty()
  @IsString()
  login: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class AdminAuthResponseDTO {
  @ApiProperty({
    description: 'JWT token for authentication',
  })
  token: string;
}

export class AdminCreateDTO {
  @ApiProperty({
    description: 'Admin username',
    example: 'admin',
  })
  @IsNotEmpty()
  @IsString()
  login: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class AdminUserIdsDTO {
  @ApiProperty({
    description: 'Array of user IDs to cache',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
    type: [String],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  userIds: string[];
}
