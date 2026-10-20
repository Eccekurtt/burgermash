import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type { CreateProductDto, UpdateOptionDto, UpdateProductDto } from './dto/product.dto.js';

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /** Müşteri ekranının ihtiyaç duyduğu her şey tek istekte. */
  async publicMenu() {
    const [products, options, settings] = await Promise.all([
      this.prisma.product.findMany({ where: { available: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.option.findMany({ where: { available: true }, orderBy: { sortOrder: 'asc' } }),
      this.settings.all(),
    ]);

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        desc: p.description,
        price: p.price,
        category: p.category.toLowerCase(),
        img: p.imageUrl,
        tag: p.tag ?? undefined,
        ingredients: p.ingredients,
        calories: p.calories ?? undefined,
        allergens: p.allergens,
        dietary: p.dietary,
      })),
      extras: options.filter((o) => o.kind === 'EXTRA').map((o) => ({ id: o.id, name: o.name, price: o.price })),
      sauces: options
        .filter((o) => o.kind === 'SAUCE')
        .map((o) => ({ id: o.id, name: o.name, price: o.price, color: o.color })),
      menu: {
        baseAdd: settings.menuBaseAdd,
        sides: products
          .filter((p) => p.menuSideDelta !== null)
          .map((p) => ({ id: p.id, delta: p.menuSideDelta })),
        drinks: products
          .filter((p) => p.menuDrinkDelta !== null)
          .map((p) => ({ id: p.id, delta: p.menuDrinkDelta })),
      },
      custom: settings.custom,
    };
  }

  adminList() {
    return this.prisma.product.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async create(dto: CreateProductDto) {
    const last = await this.prisma.product.aggregate({ _max: { sortOrder: true } });
    return this.prisma.product.create({
      data: { ...dto, sortOrder: (last._max.sortOrder ?? 0) + 1 },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('Ürün bulunamadı');
    }
  }

  adminOptions() {
    return this.prisma.option.findMany({ orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }] });
  }

  async updateOption(id: string, dto: UpdateOptionDto) {
    try {
      return await this.prisma.option.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('Seçenek bulunamadı');
    }
  }
}
