import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/auth.guards.js';
import { CreateProductDto, UpdateOptionDto, UpdateProductDto } from './dto/product.dto.js';
import { MenuService } from './menu.service.js';

@ApiTags('menu')
@Controller()
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  @Get('menu')
  publicMenu() {
    return this.menu.publicMenu();
  }

  // --- Admin ---

  @Get('admin/products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminList() {
    return this.menu.adminList();
  }

  @Post('admin/products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateProductDto) {
    return this.menu.create(dto);
  }

  @Patch('admin/products/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.menu.update(id, dto);
  }

  @Get('admin/options')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  options() {
    return this.menu.adminOptions();
  }

  @Patch('admin/options/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateOption(@Param('id') id: string, @Body() dto: UpdateOptionDto) {
    return this.menu.updateOption(id, dto);
  }
}
