import { TestBed } from '@angular/core/testing';
import {
  CalificacionDuplicadaError,
  CalificacionInvalidaError,
  CalificacionesMockService,
} from './calificaciones-mock.service';

describe('CalificacionesMockService', () => {
  let service: CalificacionesMockService;

  const nuevaCalificacion = {
    alumno: 'Alumno Demo 05',
    matricula: 'ALU-DEMO-005',
    grado: '2°',
    grupo: 'A',
    materia: 'Matemáticas',
    periodo: '2° Trimestre',
    calificacion: 8.7,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalificacionesMockService);
  });

  it('inicia con cuatro registros demo', () => {
    expect(service.obtenerCalificaciones()).toHaveLength(4);
    expect(service.total()).toBe(4);
  });

  it('obtiene una calificación por ID', () => {
    expect(service.getCalificacionById('cal-002')?.alumno).toBe('Alumno Demo 02');
  });

  it('registra una calificación normalizada', () => {
    const created = service.registrarCalificacion({
      ...nuevaCalificacion,
      alumno: '  Alumno Demo 05  ',
    });

    expect(created.alumno).toBe('Alumno Demo 05');
    expect(service.obtenerCalificaciones()).toContain(created);
  });

  it('genera un ID secuencial para el nuevo registro', () => {
    expect(service.registrarCalificacion(nuevaCalificacion).id).toBe('cal-005');
  });

  it('rechaza un duplicado lógico ignorando mayúsculas y espacios exteriores', () => {
    expect(() =>
      service.registrarCalificacion({
        ...nuevaCalificacion,
        matricula: '  alu-demo-001 ',
        materia: ' matemáticas ',
        periodo: ' 1ER TRIMESTRE ',
      }),
    ).toThrowError(CalificacionDuplicadaError);
  });

  it('actualiza un registro y permite conservar su propia combinación única', () => {
    const current = service.getCalificacionById('cal-001')!;
    const updated = service.actualizarCalificacion('cal-001', {
      ...current,
      alumno: 'Alumno Demo 01 Actualizado',
      calificacion: 9.6,
    });

    expect(updated?.alumno).toBe('Alumno Demo 01 Actualizado');
    expect(service.getCalificacionById('cal-001')?.calificacion).toBe(9.6);
  });

  it('rechaza una combinación duplicada al actualizar', () => {
    const current = service.getCalificacionById('cal-002')!;

    expect(() =>
      service.actualizarCalificacion('cal-002', {
        ...current,
        matricula: 'ALU-DEMO-001',
        materia: 'Matemáticas',
        periodo: '1er Trimestre',
      }),
    ).toThrowError(CalificacionDuplicadaError);
  });

  it('elimina un registro existente', () => {
    expect(service.eliminarCalificacion('cal-003')).toBe(true);
    expect(service.getCalificacionById('cal-003')).toBeUndefined();
  });

  it('maneja IDs inexistentes sin alterar la colección', () => {
    const total = service.total();

    expect(service.getCalificacionById('cal-999')).toBeUndefined();
    expect(service.actualizarCalificacion('cal-999', nuevaCalificacion)).toBeUndefined();
    expect(service.eliminarCalificacion('cal-999')).toBe(false);
    expect(service.total()).toBe(total);
  });

  it('actualiza el total al registrar y eliminar', () => {
    const created = service.registrarCalificacion(nuevaCalificacion);
    expect(service.total()).toBe(5);

    service.eliminarCalificacion(created.id);
    expect(service.total()).toBe(4);
  });

  it('calcula el promedio general con un decimal', () => {
    expect(service.promedioGeneral()).toBe(8.8);

    service.registrarCalificacion(nuevaCalificacion);
    expect(service.promedioGeneral()).toBe(8.8);
  });

  it('calcula las materias únicas de los registros actuales', () => {
    expect(service.materiasEvaluadas()).toBe(4);

    service.eliminarCalificacion('cal-004');
    expect(service.materiasEvaluadas()).toBe(3);
  });

  it.each([-0.1, 10.1, 8.75, Number.NaN])('rechaza la calificación inválida %s', (value) => {
    expect(() =>
      service.registrarCalificacion({ ...nuevaCalificacion, calificacion: value }),
    ).toThrowError(CalificacionInvalidaError);
  });

  it('rechaza textos obligatorios compuestos solamente por espacios', () => {
    expect(() =>
      service.registrarCalificacion({ ...nuevaCalificacion, alumno: '   ' }),
    ).toThrowError(CalificacionInvalidaError);
  });
});
