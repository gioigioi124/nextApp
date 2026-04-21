import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ example: 'Đỏ - Size M' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'SKU-RED-M' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 160000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({
    example: '{"color":"Đỏ","size":"M"}',
    description: 'JSON string of variant attributes',
  })
  @IsString()
  attributes: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Áo thun nam basic' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  basePrice: number;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Mô tả sản phẩm' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  stock: number;

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublished?: boolean;

  @ApiPropertyOptional({
    type: 'string',
    description: 'JSON string of variants array',
    example: '[{"name":"Đỏ-M","price":160000,"stock":50,"attributes":"{\\"color\\":\\"Đỏ\\"}"}]',
  })
  @IsOptional()
  @IsString()
  variants?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Danh sách ảnh sản phẩm',
  })
  @IsOptional()
  images?: any[];
}
