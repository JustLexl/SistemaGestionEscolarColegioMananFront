import { Test } from '@nestjs/testing';
import { HealthModule } from './health.module.js';

describe('HealthModule', () => {
  it('compiles independently', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
