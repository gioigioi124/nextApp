import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, MinLength, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateProductDto {
  @ApiProperty({ example: 'Áo thun nam basic' })
  @IsString()
  @MaxLength(200)
  name: string

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  basePrice: number

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  comparePrice?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  stock: number

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  categoryId: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]
}
