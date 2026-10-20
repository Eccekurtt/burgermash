import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  JwtAuthGuard,
  OptionalJwtGuard,
  Roles,
  RolesGuard,
} from '../auth/auth.guards.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CreateOrderDto, UpdateStatusDto, ValidatePromoDto } from './dto/order.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Misafir de sipariş verebilir; giriş yapmışsa sipariş hesabına bağlanır. */
  @Post('orders')
  @UseGuards(OptionalJwtGuard)
  create(@Body() dto: CreateOrderDto, @CurrentUser() user?: AuthUser) {
    return this.orders.create(dto, user);
  }

  @Post('promo/validate')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  validatePromo(@Body() dto: ValidatePromoDto) {
    return this.orders.validatePromo(dto.code);
  }

  @Get('orders/mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.mine(user.id);
  }

  /** Sipariş takibi: tahmin edilemez id ile herkese açık, kişisel bilgiler gizli. */
  @Get('orders/:id')
  @UseGuards(OptionalJwtGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.orders.findOne(id, user);
  }

  // --- Mutfak ---

  @Get('kitchen/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('KITCHEN', 'ADMIN')
  board(@Query('history') history?: string) {
    return this.orders.kitchenBoard(history === 'true');
  }

  @Patch('orders/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('KITCHEN', 'ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orders.updateStatus(id, dto.status, user);
  }
}
