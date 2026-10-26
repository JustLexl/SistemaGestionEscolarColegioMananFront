import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  it('delegates the health response to its service', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.getStatus()).toEqual({
      status: 'ok',
      service: 'Colegio Manantial API',
    });
  });
});
