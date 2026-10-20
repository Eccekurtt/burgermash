import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const ORDER_STATUSES = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export class CustomBurgerDto {
  @IsInt() @Min(1) @Max(3) patties: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  extras: string[];
}

export class OrderItemDto {
  @ApiPropertyOptional({ example: 'klasik' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomBurgerDto)
  custom?: CustomBurgerDto;

  @IsIn(['tek', 'menu']) mode: 'tek' | 'menu';

  @IsOptional() @IsString() side?: string;
  @IsOptional() @IsString() drink?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20) removed?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20) extras?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20) sauces?: string[];

  @IsOptional() @IsString() @MaxLength(120) note?: string;

  @IsInt() @Min(1) @Max(20) qty: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString() @MaxLength(80) customerName: string;

  @IsOptional() @IsString() @MaxLength(30) phone?: string;

  @IsIn(['delivery', 'pickup']) fulfillment: 'delivery' | 'pickup';

  @ValidateIf((o: CreateOrderDto) => o.fulfillment === 'delivery')
  @IsString()
  @MaxLength(250)
  address?: string;

  @IsOptional() @IsString() @MaxLength(200) note?: string;

  @IsOptional() @IsString() @MaxLength(30) promo?: string;
}

export class UpdateStatusDto {
  @IsIn(ORDER_STATUSES) status: OrderStatusValue;
}

export class ValidatePromoDto {
  @IsString() @MaxLength(30) code: string;
}
