import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.config.js';

describe('Colegio Manantial API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health uses the global prefix and returns the health contract', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'Colegio Manantial API' });
  });

  it('GET /api/profesores/status returns the reference module status', async () => {
    await request(app.getHttpServer())
      .get('/api/profesores/status')
      .expect(200)
      .expect({ module: 'profesores', status: 'ok' });
  });

  it('does not expose routes without the /api prefix', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
    await request(app.getHttpServer()).get('/profesores/status').expect(404);
  });
});
