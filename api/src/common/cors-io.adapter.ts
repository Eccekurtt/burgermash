import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

/** socket.io için de HTTP ile aynı CORS izin listesini uygular. */
export class CorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origins: string[],
  ) {
    super(app);
  }

  // socket.io tipleri @nestjs/platform-socket.io içinde ayrı bir kopya olarak kurulu; bu yüzden gevşek tip
  createIOServer(port: number, options?: any): any {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origins },
    });
  }
}
