import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureApp } from './app.config.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const configService = app.get(ConfigService);
  await app.listen(configService.getOrThrow<number>('PORT'));
}

void bootstrap();
