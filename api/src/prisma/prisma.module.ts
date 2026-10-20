import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';

@Global()
@Module({
  providers: [PrismaService, SettingsService],
  exports: [PrismaService, SettingsService],
})
export class PrismaModule {}
