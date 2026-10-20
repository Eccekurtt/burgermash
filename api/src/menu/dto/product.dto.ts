import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export const CATEGORIES = ['BURGER', 'YAN', 'TATLI', 'ICECEK'] as const;

export class CreateProductDto {
  @IsString()
  @Matches(/^[a-z0-9-]{2,40}$/, { message: 'id yalnızca küçük harf, rakam ve tire içermeli' })
  id: string;

  @IsString() @MaxLength(80) name: string;
  @IsString() @MaxLength(300) description: string;
  @IsInt() @Min(0) price: number;
  @IsIn(CATEGORIES) category: (typeof CATEGORIES)[number];
  @IsString() @MaxLength(200) imageUrl: string;

  @IsOptional() @IsString() @MaxLength(30) tag?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() available?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) tag?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) imageUrl?: string;
}

export class UpdateOptionDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() available?: boolean;
}
