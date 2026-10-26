import { ProfesoresService } from './profesores.service.js';

describe('ProfesoresService', () => {
  it('returns the module status contract', () => {
    expect(new ProfesoresService().getStatus()).toEqual({
      module: 'profesores',
      status: 'ok',
    });
  });
});
