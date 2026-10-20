import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AppSettings {
  menuBaseAdd: number;
  promos: Record<string, number>;
  custom: {
    base: number;
    pattyPrice: number;
    perPatty: Record<string, number>;
    flat: Record<string, number>;
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async all(): Promise<AppSettings> {
    const rows = await this.prisma.setting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return map as unknown as AppSettings;
  }
}
