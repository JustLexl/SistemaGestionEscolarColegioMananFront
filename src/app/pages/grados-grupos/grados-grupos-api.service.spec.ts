import { TestBed } from '@angular/core/testing';
import {
  GradoPayload,
  GradosGruposApiError,
  GradosGruposApiService,
  GrupoPayload,
} from './grados-grupos-api.service';

describe('GradosGruposApiService', () => {
  let service: GradosGruposApiService;
  let fetchMock: ReturnType<typeof vi.fn>;

  const grado = { id: '6', nombre: '6° Primaria', nivel: 'Primaria', ciclo: '2026–2027' };
  const grupo = {
    id: 10,
    gradoId: '6',
    gradoNombre: '6° Primaria',
    grupoLetra: 'Z',
    nombre: '6° Primaria - Grupo Z',
    clave: 'CM-PRI-6Z-26',
    aula: 'Aula Demo',
    edificio: 'Edificio B',
    turno: 'matutino',
    profesorId: 3,
    profesorNombre: 'Prof. Roberto Carlos Valdés',
    profesorIniciales: 'RC',
    cedula: 'DOC-2021-095',
    materias: [],
    alumnosActuales: 0,
    alumnosMax: 40,
    estado: 'Activo',
    isBase: false,
  } as const;
  const gradoPayload: GradoPayload = {
    nombre: grado.nombre,
    nivel: grado.nivel,
    ciclo: grado.ciclo,
  };
  const grupoPayload: GrupoPayload = {
    gradoId: '6',
    grupoLetra: 'Z',
    clave: grupo.clave,
    aula: grupo.aula,
    edificio: grupo.edificio,
    turno: 'matutino',
    profesorId: 3,
    alumnosMax: 40,
    estado: 'Activo',
  };

  function response(body: unknown, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as Response;
  }

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({});
    service = TestBed.inject(GradosGruposApiService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('obtiene grados reales', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: [grado] }));
    await expect(service.obtenerGrados()).resolves.toEqual([grado]);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/grados', { headers: undefined });
  });

  it('crea un grado con POST', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: grado }, 201));
    await service.crearGrado(gradoPayload);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/grados', {
      method: 'POST',
      body: JSON.stringify(gradoPayload),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('edita un grado con PUT', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: grado }));
    await service.actualizarGrado('6', gradoPayload);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/grados/6', expect.objectContaining({ method: 'PUT' }));
  });

  it('obtiene grupos reales', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: [grupo] }));
    await expect(service.obtenerGrupos()).resolves.toEqual([grupo]);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/grupos', { headers: undefined });
  });

  it('registra un grupo enviando Profesor.id', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: grupo }, 201));
    await service.crearGrupo(grupoPayload);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ profesorId: 3 });
  });

  it('edita un grupo con PUT', async () => {
    fetchMock.mockResolvedValue(response({ success: true, data: grupo }));
    await service.actualizarGrupo(10, grupoPayload);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/grupos/10', expect.objectContaining({ method: 'PUT' }));
  });

  it('carga únicamente Profesores activos para el dropdown', async () => {
    const profesores = [
      { id: 3, nombre: 'Activo', cedula: 'DOC-1', estado: 'Activo' },
      { id: 6, nombre: 'Inactivo', cedula: 'DOC-2', estado: 'Inactivo' },
    ];
    fetchMock.mockResolvedValue(response({ success: true, data: profesores }));
    await expect(service.obtenerProfesoresActivos()).resolves.toEqual([profesores[0]]);
  });

  it('muestra un error controlado cuando el backend no responde', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const error = await service.obtenerGrados().catch((reason) => reason);
    expect(error).toBeInstanceOf(GradosGruposApiError);
    expect(error).toMatchObject({ status: 0 });
  });

  it('propaga el mensaje de Profesor inactivo', async () => {
    fetchMock.mockResolvedValue(response({ success: false, error: 'El profesor seleccionado está inactivo.' }, 409));
    await expect(service.crearGrupo(grupoPayload)).rejects.toMatchObject({
      status: 409,
      message: 'El profesor seleccionado está inactivo.',
    });
  });
});
