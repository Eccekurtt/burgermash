import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type { CreateOrderDto, OrderStatusValue } from './dto/order.dto.js';
import { OrdersGateway } from './orders.gateway.js';
import { applyPromo, priceItem, type Catalog } from './pricing.js';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

/** Mutfağın uygulayabileceği geçişler. */
export const TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  RECEIVED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const ACTIVE: OrderStatusValue[] = ['RECEIVED', 'PREPARING', 'ON_THE_WAY'];

function publicConfig(config: unknown, full: boolean) {
  if (full || !config || typeof config !== 'object') return full ? config : null;
  const { note: _note, ...rest } = config as Record<string, unknown>;
  return rest;
}

export function toView(o: OrderWithItems, full: boolean) {
  return {
    id: o.id,
    status: o.status,
    fulfillment: o.fulfillment,
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    promo: o.promo,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.name,
      unitPrice: i.unitPrice,
      qty: i.qty,
      details: i.details,
      imageUrl: i.imageUrl,
      // Ham seçimler dilden bağımsızdır; ön yüz bunlardan ad ve detayları seçilen dilde üretir.
      // Serbest metin olan not, kişisel veri sayılabileceği için herkese açık görünümde yoktur.
      config: publicConfig(i.config, full),
    })),
    // Kişisel bilgiler yalnızca sipariş sahibine ve personele gösterilir
    ...(full
      ? { customerName: o.customerName, phone: o.phone, address: o.address, note: o.note }
      : {}),
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly gateway: OrdersGateway,
  ) {}

  private async catalog(): Promise<Catalog> {
    const [products, options, settings] = await Promise.all([
      this.prisma.product.findMany(),
      this.prisma.option.findMany(),
      this.settings.all(),
    ]);
    return {
      products: new Map(products.map((p) => [p.id, p])),
      extras: new Map(options.filter((o) => o.kind === 'EXTRA').map((o) => [o.id, o])),
      sauces: new Map(options.filter((o) => o.kind === 'SAUCE').map((o) => [o.id, o])),
      settings,
    };
  }

  /** Ham seçimleri (adet hariç) sakla; "tekrar sipariş ver" bunlarla yeniden fiyatlanır. */
  private rawConfig(item: CreateOrderDto['items'][number]): Prisma.InputJsonObject {
    const { qty: _qty, ...rest } = item;
    return JSON.parse(JSON.stringify(rest)) as Prisma.InputJsonObject;
  }

  async validatePromo(code: string) {
    const { promos } = await this.settings.all();
    const key = code.trim().toUpperCase();
    if (!(key in promos)) throw new BadRequestException('Geçersiz promosyon kodu');
    return { code: key, rate: promos[key] };
  }

  async create(dto: CreateOrderDto, user?: AuthUser) {
    const catalog = await this.catalog();
    const lines = dto.items.map((i) => priceItem(i, catalog));
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const { code, discount } = applyPromo(subtotal, dto.promo, catalog.settings.promos);

    const order = await this.prisma.order.create({
      data: {
        userId: user?.id,
        customerName: dto.customerName.trim(),
        phone: dto.phone?.trim() || null,
        address: dto.fulfillment === 'delivery' ? dto.address?.trim() : null,
        fulfillment: dto.fulfillment,
        note: dto.note?.trim() || null,
        subtotal,
        discount,
        total: subtotal - discount,
        promo: code,
        items: {
          create: lines.map((l, idx) => ({
            config: this.rawConfig(dto.items[idx]),
            productId: l.productId,
            name: l.name,
            unitPrice: l.unitPrice,
            qty: l.qty,
            details: l.details,
            imageUrl: l.imageUrl,
          })),
        },
      },
      include: { items: true },
    });

    this.gateway.emitNew(toView(order, true));
    return toView(order, true);
  }

  async findOne(id: string, user?: AuthUser) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    const full = !!user && (user.role !== 'CUSTOMER' || order.userId === user.id);
    return toView(order, full);
  }

  async mine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return orders.map((o) => toView(o, true));
  }

  async kitchenBoard(history: boolean) {
    const orders = await this.prisma.order.findMany({
      where: history ? { status: { in: ['DELIVERED', 'CANCELLED'] } } : { status: { in: ACTIVE } },
      include: { items: true },
      orderBy: { createdAt: history ? 'desc' : 'asc' },
      take: 100,
    });
    return orders.map((o) => toView(o, true));
  }

  async updateStatus(id: string, status: OrderStatusValue, user: AuthUser) {
    if (user.role === 'CUSTOMER') throw new ForbiddenException();
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    const allowed = TRANSITIONS[order.status as OrderStatusValue];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`${order.status} durumundan ${status} durumuna geçilemez`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    this.gateway.emitUpdated(id, toView(updated, true), toView(updated, false));
    return toView(updated, true);
  }
}
