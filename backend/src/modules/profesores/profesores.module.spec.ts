import { Test } from '@nestjs/testing';
import { ProfesoresModule } from './profesores.module.js';

describe('ProfesoresModule', () => {
  it('compiles independently', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProfesoresModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
