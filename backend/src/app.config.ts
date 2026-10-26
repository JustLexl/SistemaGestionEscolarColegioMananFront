import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import {
  API_PREFIX,
  FRONTEND_ORIGIN,
} from './common/constants/app.constants.js';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.enableCors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
