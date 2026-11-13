import { TestBed } from '@angular/core/testing';
import {
  ImportacionApiError,
  ImportacionApiService,
  RegistroImportacion,
} from './importacion-api.service';

describe('ImportacionApiService', () => {
  let service: ImportacionApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportacionApiService);
  });

  afterEach(() => vi.unstubAllGlobals());

  const validacion = {
    success: true,
    mensaje: 'Validación finalizada.',
    totalRegistros: 1,
    totalValidos: 1,
    totalErrores: 0,
    validos: [{ matricula: 'CM-2026-001', alumnoId: 1, fecha: '2026-11-12', estado: 'Presente' }],
    errores: [],
  };

  it('envía el archivo como multipart al endpoint de la entidad', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(validacion), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const archivo = new File(['matricula,fecha,estado'], 'asistencias.csv', { type: 'text/csv' });
    const resultado = await service.validarArchivo('asistencias', archivo);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3002/api/importacion/asistencias/validar');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('archivo')).toBe(archivo);
    expect(resultado.totalValidos).toBe(1);
  });

  it('confirma con un cuerpo JSON que contiene sólo validos', async () => {
    const respuesta = { success: true, mensaje: 'Importación finalizada.', totalImportados: 1 };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(respuesta), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const validos: readonly RegistroImportacion[] = validacion.validos;
    await service.confirmar('asistencias', validos);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3002/api/importacion/asistencias/confirmar');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ validos });
  });

  it('descarga la plantilla con el nombre del backend', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:plantilla');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('matricula,fecha,estado', {
      status: 200,
      headers: { 'Content-Disposition': 'attachment; filename="plantilla_asistencias.csv"' },
    })));
    await service.descargarPlantilla('asistencias');
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:plantilla');
    click.mockRestore();
  });

  it('conserva literalmente el mensaje del backend para 413', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      mensaje: 'El archivo supera el tamaño máximo permitido de 10 MB.',
    }), { status: 413 })));
    const archivo = new File(['x'], 'asistencias.csv');
    await expect(service.validarArchivo('asistencias', archivo)).rejects.toEqual(
      expect.objectContaining({
        status: 413,
        message: 'El archivo supera el tamaño máximo permitido de 10 MB.',
      }),
    );
  });

  it('propaga mensajes de validación del backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      mensaje: 'Solo se permiten archivos Excel (.xlsx) o CSV.',
    }), { status: 400 })));
    await expect(service.validarArchivo('alumnos', new File(['x'], 'alumnos.txt')))
      .rejects.toBeInstanceOf(ImportacionApiError);
  });

  it('convierte un fallo de red en un error legible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(service.confirmar('grados', [])).rejects.toEqual(
      expect.objectContaining({ status: 0, message: expect.stringMatching(/backend/i) }),
    );
  });

  it('rechaza respuestas exitosas que no contienen JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no-json', { status: 200 })));
    await expect(service.validarArchivo('grupos', new File(['x'], 'grupos.csv'))).rejects.toEqual(
      expect.objectContaining({ status: 200, message: expect.stringMatching(/interpretar/i) }),
    );
  });
});

