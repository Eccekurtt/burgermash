import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SkipThrottle } from '@nestjs/throttler';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Gerçek zamanlı kanal.
 *  - mutfak/admin: "kitchen" odasına otomatik katılır, tüm siparişleri görür
 *  - müşteri: "track" mesajıyla sadece kendi siparişinin odasına katılır
 */
@SkipThrottle()
@Injectable()
@WebSocketGateway()
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    const token = (client.handshake.auth as { token?: string } | undefined)?.token;
    if (!token) return;
    try {
      const p = this.jwt.verify<JwtPayload>(token);
      if (p.role === 'KITCHEN' || p.role === 'ADMIN') void client.join('kitchen');
    } catch {
      // geçersiz token: misafir olarak devam
    }
  }

  @SubscribeMessage('track')
  async track(@ConnectedSocket() client: Socket, @MessageBody() body: { orderId?: string }) {
    if (!body?.orderId) return { ok: false };
    const order = await this.prisma.order.findUnique({
      where: { id: body.orderId },
      select: { id: true, status: true },
    });
    if (!order) return { ok: false };
    await client.join(`order:${order.id}`);
    return { ok: true, status: order.status };
  }

  emitNew(fullView: unknown) {
    this.server?.to('kitchen').emit('order:new', fullView);
  }

  emitUpdated(orderId: string, fullView: unknown, publicView: unknown) {
    this.server?.to('kitchen').emit('order:updated', fullView);
    this.server?.to(`order:${orderId}`).emit('order:updated', publicView);
  }
}
