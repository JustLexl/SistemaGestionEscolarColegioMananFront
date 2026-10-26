import { Test } from '@nestjs/testing';
import { ProfesoresController } from './profesores.controller.js';
import { ProfesoresService } from './profesores.service.js';

describe('ProfesoresController', () => {
  it('delegates the status response to its service', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProfesoresController],
      providers: [ProfesoresService],
    }).compile();

    const controller = moduleRef.get(ProfesoresController);
    expect(controller.getStatus()).toEqual({
      module: 'profesores',
      status: 'ok',
    });
  });
});
