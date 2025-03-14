import { IsNumber, IsPositive, Min, IsOptional } from 'class-validator';
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationOffset {
  constructor(offset: number) {
    this.offset = offset;
  }

  @ApiProperty({ description: 'Number of items to skip', example: 0 })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Min(0)
  offset: number;
}

export class PaginationLimit {
  constructor(limit: number) {
    this.limit = limit;
  }

  @ApiProperty({
    description: 'Maximum number of items to be returned',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Min(1)
  limit: number;
}

export class PaginationQuery {
  offset: PaginationOffset;
  limit: PaginationLimit;
}

export class PaginationResponse<T> {
  @ApiProperty({ type: [Object], description: 'List of returned data' })
  data: T[];

  @ApiProperty({ description: 'Total number of available items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Number of items skipped', example: 0 })
  offset: number;

  @ApiProperty({
    description: 'Maximum number of items returned',
    example: 10,
  })
  limit: number;
}

export const validatePaginationQuery = (limit: number, offset: number) => {
  const paginationLimit = new PaginationLimit(limit);
  const paginationOffset = new PaginationOffset(offset);

  return {
    validatedLimit: paginationLimit.limit,
    validatedOffset: paginationOffset.offset,
  };
};
