import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/env.validation.js';
import { PrismaModule } from './database/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ProfesoresModule } from './modules/profesores/profesores.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    ProfesoresModule,
  ],
})
export class AppModule {}
