import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('returns the API health contract', () => {
    expect(new HealthService().getStatus()).toEqual({
      status: 'ok',
      service: 'Colegio Manantial API',
    });
  });
});
