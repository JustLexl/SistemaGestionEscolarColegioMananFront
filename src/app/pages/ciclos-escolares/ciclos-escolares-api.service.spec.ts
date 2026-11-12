import { TestBed } from '@angular/core/testing';
import {
  CicloEscolarPayload,
  CiclosEscolaresApiError,
  CiclosEscolaresApiService,
} from './ciclos-escolares-api.service';

describe('CiclosEscolaresApiService', () => {
  let service: CiclosEscolaresApiService;
  let fetchMock: ReturnType<typeof vi.fn>;
  const ciclo = {
    id: 3, nombre: '2027–2028', fechaInicio: '2027-08-30', fechaFin: '2028-07-14', estado: 'Planeacion',
  } as const;
  const payload: CicloEscolarPayload = {
    nombre: ciclo.nombre, fechaInicio: ciclo.fechaInicio, fechaFin: ciclo.fechaFin,
  };

  function response(body: unknown, status = 200): Response {
    return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response;
  }

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({});
    service = TestBed.inject(CiclosEscolaresApiService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('consulta todos los ciclos', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: [ciclo] }));
    await expect(service.obtenerCiclos()).resolves.toEqual([ciclo]);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/ciclos-escolares', { headers: undefined });
  });

  it('consulta un ciclo por id', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: ciclo }));
    await service.obtenerCiclo(3);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/ciclos-escolares/3', { headers: undefined });
  });

  it('crea un ciclo con POST', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: ciclo }, 201));
    await service.crearCiclo(payload);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/ciclos-escolares', {
      method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' },
    });
  });

  it('actualiza un ciclo con PUT', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: ciclo }));
    await service.actualizarCiclo(3, payload);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/ciclos-escolares/3', expect.objectContaining({ method: 'PUT' }));
  });

  it('propaga validaciones del backend', async () => {
    fetchMock.mockResolvedValue(response({ success: false, error: 'Las fechas se solapan.' }, 409));
    await expect(service.crearCiclo(payload)).rejects.toMatchObject({ status: 409, message: 'Las fechas se solapan.' });
  });

  it('convierte errores de red en un mensaje controlado', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const error = await service.obtenerCiclos().catch((reason) => reason);
    expect(error).toBeInstanceOf(CiclosEscolaresApiError);
    expect(error).toMatchObject({ status: 0 });
  });
});
