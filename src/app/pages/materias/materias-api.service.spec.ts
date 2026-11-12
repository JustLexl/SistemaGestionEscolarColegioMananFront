import { TestBed } from '@angular/core/testing';
import { MateriasApiService, MateriaPayload } from './materias-api.service';

describe('MateriasApiService', () => {
  let service: MateriasApiService;
  const payload: MateriaPayload = {
    nombre: 'Materia Demo', codigo: 'DEM', claveSep: 'DEM-SEC-01',
    cargaHoraria: '4 hrs/sem', grupoIds: [10], profesorId: 3,
    estado: 'Activa', isTroncoComun: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MateriasApiService);
  });

  afterEach(() => vi.unstubAllGlobals());

  function responder(data: unknown, status = 200) {
    return new Response(JSON.stringify(status < 400
      ? { success: true, data }
      : { success: false, error: data }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('consulta catálogo, métricas y catálogos relacionados', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/materias/metrics')) return Promise.resolve(responder({ total: 0 }));
      return Promise.resolve(responder([]));
    });
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([
      service.obtenerMaterias(), service.obtenerMetricas(), service.obtenerCiclos(),
      service.obtenerGrupos(), service.obtenerProfesores(),
    ]);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual(expect.arrayContaining([
      expect.stringMatching(/\/materias$/),
      expect.stringMatching(/\/materias\/metrics$/),
      expect.stringMatching(/\/ciclos-escolares$/),
      expect.stringMatching(/\/grupos$/),
      expect.stringMatching(/\/profesores$/),
    ]));
  });

  it('crea usando grupoIds sin campos legacy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(responder({ id: 19 }));
    vi.stubGlobal('fetch', fetchMock);
    await service.crearMateria(payload);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(init.method).toBe('POST');
    expect(body.grupoIds).toEqual([10]);
    expect(body).not.toHaveProperty('gruposAsignados');
  });

  it('actualiza por id con PUT', async () => {
    const fetchMock = vi.fn().mockResolvedValue(responder({ id: 19 }));
    vi.stubGlobal('fetch', fetchMock);
    await service.actualizarMateria(19, payload);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/materias\/19$/);
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
  });

  it('da de baja con PATCH', async () => {
    const fetchMock = vi.fn().mockResolvedValue(responder({ id: 19, estado: 'Inactiva' }));
    vi.stubGlobal('fetch', fetchMock);
    await service.darDeBaja(19);
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
  });

  it('propaga el mensaje controlado del backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responder('Clave SEP duplicada.', 409)));
    await expect(service.crearMateria(payload)).rejects.toEqual(
      expect.objectContaining({ status: 409, message: 'Clave SEP duplicada.' }),
    );
  });

  it('convierte un fallo de red en error legible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(service.obtenerMaterias()).rejects.toEqual(
      expect.objectContaining({ status: 0 }),
    );
  });
});
