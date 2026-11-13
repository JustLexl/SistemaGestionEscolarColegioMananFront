import { TestBed } from '@angular/core/testing';
import { CalificacionDatos } from '../models/calificacion.model';
import {
  CalificacionesApiError,
  CalificacionesApiService,
} from './calificaciones-api.service';

describe('CalificacionesApiService', () => {
  let service: CalificacionesApiService;
  let fetchMock: ReturnType<typeof vi.fn>;

  const calificacion = {
    id: 'cal-001',
    alumno: 'Sofía Hernández López',
    matricula: 'CM-2026-001',
    grado: '4°',
    grupo: 'A',
    materia: 'Matemáticas IV',
    periodo: '1er Trimestre',
    calificacion: 9.2,
  };

  const datos: CalificacionDatos = {
    alumno: calificacion.alumno,
    matricula: calificacion.matricula,
    grado: calificacion.grado,
    grupo: calificacion.grupo,
    materia: calificacion.materia,
    periodo: calificacion.periodo,
    calificacion: calificacion.calificacion,
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
    service = TestBed.inject(CalificacionesApiService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('obtiene y extrae la colección de calificaciones', async () => {
    fetchMock.mockResolvedValue(
      response({ success: true, count: 1, data: [calificacion] }),
    );

    await expect(service.obtenerCalificaciones()).resolves.toEqual([
      calificacion,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3002/api/calificaciones',
      {
        headers: undefined,
      },
    );
  });

  it('obtiene los catálogos de alumnos y materias', async () => {
    const alumnos = [
      {
        id: 1,
        matricula: 'CM-2026-001',
        nombre: 'Sofía',
        grado: '4° Primaria',
        grupo: 'Grupo A',
      },
    ];
    const materias = [{ id: 1, nombre: 'Matemáticas IV' }];
    fetchMock
      .mockResolvedValueOnce(response({ success: true, data: alumnos }))
      .mockResolvedValueOnce(response({ success: true, data: materias }));

    await expect(service.obtenerAlumnos()).resolves.toEqual(alumnos);
    await expect(service.obtenerMaterias()).resolves.toEqual(materias);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3002/api/alumnos',
      'http://localhost:3002/api/materias',
    ]);
  });

  it('registra una calificación enviando JSON al backend', async () => {
    fetchMock.mockResolvedValue(
      response({ success: true, data: calificacion }, 201),
    );

    await expect(service.registrarCalificacion(datos)).resolves.toEqual(
      calificacion,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3002/api/calificaciones',
      {
        method: 'POST',
        body: JSON.stringify(datos),
        headers: { 'Content-Type': 'application/json' },
      },
    );
  });

  it('actualiza una calificación usando el ID codificado', async () => {
    fetchMock.mockResolvedValue(
      response({ success: true, data: calificacion }),
    );

    await service.actualizarCalificacion('cal/001', datos);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3002/api/calificaciones/cal%2F001',
      {
        method: 'PUT',
        body: JSON.stringify(datos),
        headers: { 'Content-Type': 'application/json' },
      },
    );
  });

  it('elimina una calificación aunque la respuesta no incluya data', async () => {
    fetchMock.mockResolvedValue(
      response({ success: true, message: 'Eliminada.' }),
    );

    await expect(
      service.eliminarCalificacion('cal-001'),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3002/api/calificaciones/cal-001',
      {
        method: 'DELETE',
        headers: undefined,
      },
    );
  });

  it('propaga el estado y mensaje de un error HTTP', async () => {
    fetchMock.mockResolvedValue(
      response({ success: false, error: 'Ya existe una calificación.' }, 409),
    );

    const error = await service
      .registrarCalificacion(datos)
      .catch((reason) => reason);

    expect(error).toBeInstanceOf(CalificacionesApiError);
    expect(error).toMatchObject({
      status: 409,
      message: 'Ya existe una calificación.',
    });
  });

  it('reporta una respuesta exitosa sin data', async () => {
    fetchMock.mockResolvedValue(response({ success: true }));

    await expect(service.obtenerCalificaciones()).rejects.toMatchObject({
      status: 200,
      message: 'El servidor devolvió una respuesta sin datos.',
    });
  });

  it('reporta cuando no puede conectar con el backend', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(service.obtenerCalificaciones()).rejects.toMatchObject({
      status: 0,
      message: 'No fue posible conectar con el servidor de Calificaciones.',
    });
  });
});

