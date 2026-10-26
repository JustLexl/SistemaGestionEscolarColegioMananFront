import { Test } from '@nestjs/testing';
import { AppModule } from './app.module.js';

describe('AppModule', () => {
  it('compiles the official application modules', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
