import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
