import { ComponentFixture, TestBed } from '@angular/core/testing';
import { routes } from '../../app.routes';
import {
  ImportacionApiError,
  ImportacionApiService,
  ResultadoValidacion,
} from './importacion-api.service';
import { ImportacionComponent } from './importacion.component';

describe('ImportacionComponent', () => {
  let component: ImportacionComponent;
  let fixture: ComponentFixture<ImportacionComponent>;
  let api: Record<string, ReturnType<typeof vi.fn>>;

  const resultado: ResultadoValidacion = {
    success: true,
    mensaje: 'Validación de asistencias finalizada.',
    totalRegistros: 4,
    totalValidos: 2,
    totalErrores: 2,
    validos: [
      { matricula: 'CM-2026-001', alumnoId: 1, fecha: '2026-11-12', estado: 'Presente' },
      { matricula: 'CM-2026-002', alumnoId: 2, fecha: '2026-11-12', estado: 'Ausente' },
    ],
    errores: [
      { fila: 4, matricula: 'NO-EXISTE', motivos: ['La matrícula no existe.', 'Revisa el identificador.'] },
      { fila: 5, matricula: 'CM-2026-005', motivos: ['El alumno está inactivo.'] },
    ],
  };

  beforeEach(async () => {
    api = {
      descargarPlantilla: vi.fn().mockResolvedValue(undefined),
      validarArchivo: vi.fn().mockResolvedValue(resultado),
      confirmar: vi.fn().mockResolvedValue({
        success: true,
        mensaje: 'Importación de asistencias finalizada correctamente.',
        totalImportados: 2,
      }),
    };
    await TestBed.configureTestingModule({
      imports: [ImportacionComponent],
      providers: [{ provide: ImportacionApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(ImportacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const ui = () => component as any;
  const csv = (name = 'asistencias.csv') => new File(
    ['matricula,fecha,estado\nCM-2026-001,12/11/2026,Presente'],
    name,
    { type: 'text/csv' },
  );

  it('registra la ruta /importacion en el shell', () => {
    const shell = routes.find((route) => route.path === '');
    expect(shell?.children?.some((route) => route.path === 'importacion')).toBe(true);
  });

  it('muestra las seis entidades disponibles', () => {
    expect(ui().entidades.map((item: any) => item.id)).toEqual([
      'alumnos', 'profesores', 'grados', 'grupos', 'materias', 'asistencias',
    ]);
    expect(fixture.nativeElement.querySelectorAll('.entity-card').length).toBe(6);
  });

  it('inicia en asistencias y estado inicial', () => {
    expect(ui().entidad()).toBe('asistencias');
    expect(ui().estado()).toBe('inicial');
    expect(fixture.nativeElement.textContent).toContain('Selecciona el archivo de Asistencias');
  });

  it('selecciona un CSV válido y muestra nombre, tamaño y entidad', () => {
    ui().seleccionarArchivo(csv());
    fixture.detectChanges();
    expect(ui().estado()).toBe('archivo-seleccionado');
    expect(fixture.nativeElement.textContent).toContain('asistencias.csv');
    expect(fixture.nativeElement.textContent).toContain('Asistencias');
  });

  it('acepta un archivo xlsx', () => {
    ui().seleccionarArchivo(new File(['excel'], 'alumnos.xlsx'));
    expect(ui().archivo()?.name).toBe('alumnos.xlsx');
  });

  it('rechaza extensiones distintas de xlsx o csv', () => {
    ui().seleccionarArchivo(csv('asistencias.txt'));
    expect(ui().estado()).toBe('error');
    expect(ui().mensajeError()).toContain('Excel (.xlsx) o CSV');
  });

  it('rechaza archivos mayores de 10 MB con el mensaje exacto', () => {
    ui().seleccionarArchivo(new File([new Uint8Array((10 * 1024 * 1024) + 1)], 'grande.csv'));
    expect(ui().mensajeError()).toBe('El archivo supera el tamaño máximo permitido de 10 MB.');
    expect(ui().archivo()).toBeNull();
  });

  it('reemplaza el archivo seleccionado', () => {
    ui().seleccionarArchivo(csv('primero.csv'));
    ui().seleccionarArchivo(csv('segundo.csv'));
    expect(ui().archivo()?.name).toBe('segundo.csv');
  });

  it('descarga la plantilla para la entidad activa', async () => {
    ui().seleccionarEntidad('materias');
    await ui().descargarPlantilla();
    expect(api['descargarPlantilla']).toHaveBeenCalledWith('materias');
  });

  it('valida el archivo mediante multipart y conserva los resultados', async () => {
    const archivo = csv();
    ui().seleccionarArchivo(archivo);
    await ui().validar();
    expect(api['validarArchivo']).toHaveBeenCalledWith('asistencias', archivo);
    expect(ui().estado()).toBe('validado');
    expect(ui().resultado()).toEqual(resultado);
  });

  it('muestra el estado Validando y bloquea acciones mientras espera', async () => {
    let resolver!: (valor: ResultadoValidacion) => void;
    api['validarArchivo'].mockReturnValueOnce(new Promise((resolve) => { resolver = resolve; }));
    ui().seleccionarArchivo(csv());
    const peticion = ui().validar();
    fixture.detectChanges();
    expect(ui().estado()).toBe('validando');
    expect(ui().ocupado()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Validando archivo');
    resolver(resultado);
    await peticion;
  });

  it('renderiza los tres KPIs de validación', async () => {
    ui().seleccionarArchivo(csv());
    await ui().validar();
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Registros encontrados');
    expect(texto).toContain('Registros válidos');
    expect(texto).toContain('Registros con errores');
  });

  it('crea una vista previa adaptable a las columnas devueltas', async () => {
    ui().seleccionarArchivo(csv());
    await ui().validar();
    fixture.detectChanges();
    expect(ui().columnasVista()).toEqual(['matricula', 'alumnoId', 'fecha', 'estado']);
    expect(fixture.nativeElement.querySelector('.preview-table').textContent).toContain('CM-2026-001');
  });

  it('muestra fila y múltiples motivos para cada error', async () => {
    ui().seleccionarArchivo(csv());
    await ui().validar();
    fixture.detectChanges();
    const texto = fixture.nativeElement.querySelector('.error-list').textContent;
    expect(texto).toContain('Fila 4');
    expect(texto).toContain('NO-EXISTE');
    expect(texto).toContain('La matrícula no existe.');
    expect(texto).toContain('Revisa el identificador.');
  });

  it('no confirma cuando la validación no contiene registros válidos', async () => {
    api['validarArchivo'].mockResolvedValueOnce({ ...resultado, totalValidos: 0, validos: [] });
    ui().seleccionarArchivo(csv());
    await ui().validar();
    await ui().confirmar();
    expect(api['confirmar']).not.toHaveBeenCalled();
    expect(ui().puedeConfirmar()).toBe(false);
  });

  it('confirma enviando únicamente el arreglo de válidos', async () => {
    ui().seleccionarArchivo(csv());
    await ui().validar();
    expect(ui().puedeConfirmar()).toBe(true);
    await ui().confirmar();
    expect(api['confirmar']).toHaveBeenCalledWith('asistencias', resultado.validos);
    expect(ui().estado()).toBe('completado');
  });

  it('muestra el resumen de importación completada', async () => {
    ui().seleccionarArchivo(csv());
    await ui().validar();
    await ui().confirmar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.completion').textContent).toContain('2 registros importados');
    expect(fixture.nativeElement.querySelector('.completion').textContent).toContain('Asistencias');
    expect(fixture.nativeElement.querySelector('.completion').textContent).toContain('2 descartados');
    expect(fixture.nativeElement.querySelector('.completion').textContent).toContain('Nueva importación');
  });

  it('reinicia todo el flujo conservando la entidad', async () => {
    ui().seleccionarEntidad('alumnos');
    ui().seleccionarArchivo(csv('alumnos.csv'));
    await ui().validar();
    ui().reiniciar();
    expect(ui().entidad()).toBe('alumnos');
    expect(ui().archivo()).toBeNull();
    expect(ui().resultado()).toBeNull();
    expect(ui().estado()).toBe('inicial');
  });

  it('cambiar de entidad limpia archivo y validación previa', async () => {
    ui().seleccionarArchivo(csv());
    await ui().validar();
    ui().seleccionarEntidad('profesores');
    expect(ui().archivo()).toBeNull();
    expect(ui().resultado()).toBeNull();
    expect(ui().estado()).toBe('inicial');
  });

  it('muestra literalmente el error 413 del backend', async () => {
    api['validarArchivo'].mockRejectedValueOnce(new ImportacionApiError(
      413,
      'El archivo supera el tamaño máximo permitido de 10 MB.',
    ));
    ui().seleccionarArchivo(csv());
    await ui().validar();
    expect(ui().estado()).toBe('error');
    expect(ui().mensajeError()).toBe('El archivo supera el tamaño máximo permitido de 10 MB.');
  });

  it('muestra fallos de conexión de forma controlada', async () => {
    api['validarArchivo'].mockRejectedValueOnce(new ImportacionApiError(0, 'Backend no disponible.'));
    ui().seleccionarArchivo(csv());
    await ui().validar();
    expect(ui().mensajeError()).toContain('Backend no disponible');
  });

  it('formatea tamaños legibles para B, KB y MB', () => {
    expect(ui().formatearTamano(512)).toBe('512 B');
    expect(ui().formatearTamano(2048)).toBe('2.0 KB');
    expect(ui().formatearTamano(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
