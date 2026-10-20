import { TestBed } from '@angular/core/testing';
import { CedulaProfesorDuplicadaError, ProfesoresMockService } from './profesores-mock.service';

describe('ProfesoresMockService', () => {
  let service: ProfesoresMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfesoresMockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should contain the three expected demo profesores', () => {
    expect(service.profesores()).toHaveLength(3);
    expect(service.profesores().map((profesor) => profesor.cedula)).toEqual([
      'DOC-DEMO-001',
      'DOC-DEMO-002',
      'DOC-DEMO-003',
    ]);
  });

  it('should return the profesor that matches the requested id', () => {
    expect(service.getProfesorById(2)).toEqual(
      expect.objectContaining({
        id: 2,
        nombre: 'Docente Demo 02',
        cedula: 'DOC-DEMO-002',
      }),
    );
  });

  it('should return undefined for an unknown id without throwing', () => {
    expect(() => service.getProfesorById(999)).not.toThrow();
    expect(service.getProfesorById(999)).toBeUndefined();
  });

  it('should register a profesor and increase the collection length', () => {
    const initialLength = service.profesores().length;

    const profesor = service.registrarProfesor({
      nombre: '  Docente Demo 04  ',
      cedula: '  DOC-DEMO-004  ',
    });

    expect(service.profesores()).toHaveLength(initialLength + 1);
    expect(service.profesores().at(-1)).toBe(profesor);
    expect(profesor.nombre).toBe('Docente Demo 04');
    expect(profesor.cedula).toBe('DOC-DEMO-004');
  });

  it('should create an active profesor with empty assignments and a unique internal id', () => {
    const existingIds = service.profesores().map((profesor) => profesor.id);

    const profesor = service.registrarProfesor({
      nombre: 'Docente Demo 04',
      cedula: 'DOC-DEMO-004',
    });

    expect(profesor.estado).toBe('Activo');
    expect(profesor.materiasAsignadas).toEqual([]);
    expect(profesor.gruposAsignados).toEqual([]);
    expect(existingIds).not.toContain(profesor.id);
  });

  it('should reject a duplicate cedula regardless of surrounding spaces and casing', () => {
    const initialLength = service.profesores().length;

    expect(() =>
      service.registrarProfesor({
        nombre: 'Otro docente',
        cedula: '  doc-demo-001  ',
      }),
    ).toThrow(CedulaProfesorDuplicadaError);
    expect(service.profesores()).toHaveLength(initialLength);
  });

  it('should update nombre and cedula while preserving the rest of the profesor data', () => {
    const profesorBeforeUpdate = service.getProfesorById(1);
    const initialLength = service.profesores().length;

    const profesorActualizado = service.actualizarProfesor(1, {
      nombre: '  Docente Demo 01 Actualizado  ',
      cedula: '  DOC-DEMO-001-A  ',
    });

    expect(profesorActualizado).toEqual({
      ...profesorBeforeUpdate,
      nombre: 'Docente Demo 01 Actualizado',
      cedula: 'DOC-DEMO-001-A',
    });
    expect(profesorActualizado?.id).toBe(profesorBeforeUpdate?.id);
    expect(profesorActualizado?.estado).toBe(profesorBeforeUpdate?.estado);
    expect(profesorActualizado?.materiasAsignadas).toBe(profesorBeforeUpdate?.materiasAsignadas);
    expect(profesorActualizado?.gruposAsignados).toBe(profesorBeforeUpdate?.gruposAsignados);
    expect(service.profesores()).toHaveLength(initialLength);
  });

  it('should allow a profesor to keep their own cedula', () => {
    const profesorActualizado = service.actualizarProfesor(1, {
      nombre: 'Docente Demo 01',
      cedula: '  doc-demo-001  ',
    });

    expect(profesorActualizado?.cedula).toBe('doc-demo-001');
    expect(service.profesores()).toHaveLength(3);
  });

  it('should reject a cedula that belongs to another profesor without modifying data', () => {
    const profesoresBeforeUpdate = service.profesores();

    expect(() =>
      service.actualizarProfesor(1, {
        nombre: 'Docente Demo 01',
        cedula: '  doc-demo-002  ',
      }),
    ).toThrow(CedulaProfesorDuplicadaError);
    expect(service.profesores()).toBe(profesoresBeforeUpdate);
  });

  it('should safely return undefined for an unknown id without modifying data', () => {
    const profesoresBeforeUpdate = service.profesores();

    expect(
      service.actualizarProfesor(999, {
        nombre: 'Profesor inexistente',
        cedula: 'DOC-INEXISTENTE',
      }),
    ).toBeUndefined();
    expect(service.profesores()).toBe(profesoresBeforeUpdate);
  });

  it('should deactivate a profesor while preserving all other data and collection length', () => {
    const profesorBeforeDeactivation = service.getProfesorById(1);
    const initialLength = service.profesores().length;

    const profesorInactivo = service.darDeBajaProfesor(1);

    expect(profesorInactivo).toEqual({
      ...profesorBeforeDeactivation,
      estado: 'Inactivo',
    });
    expect(profesorInactivo?.id).toBe(profesorBeforeDeactivation?.id);
    expect(profesorInactivo?.nombre).toBe(profesorBeforeDeactivation?.nombre);
    expect(profesorInactivo?.cedula).toBe(profesorBeforeDeactivation?.cedula);
    expect(profesorInactivo?.materiasAsignadas).toBe(profesorBeforeDeactivation?.materiasAsignadas);
    expect(profesorInactivo?.gruposAsignados).toBe(profesorBeforeDeactivation?.gruposAsignados);
    expect(service.profesores()).toHaveLength(initialLength);
  });

  it('should not modify another profesor when deactivating by id', () => {
    const secondProfesorBeforeDeactivation = service.getProfesorById(2);

    service.darDeBajaProfesor(1);

    expect(service.getProfesorById(2)).toBe(secondProfesorBeforeDeactivation);
  });

  it('should safely return undefined for an unknown deactivation id', () => {
    const profesoresBeforeDeactivation = service.profesores();

    expect(service.darDeBajaProfesor(999)).toBeUndefined();
    expect(service.profesores()).toBe(profesoresBeforeDeactivation);
  });

  it('should keep an inactive profesor consistent when deactivation is requested again', () => {
    const inactiveProfesor = service.getProfesorById(3);
    const profesoresBeforeDeactivation = service.profesores();

    expect(service.darDeBajaProfesor(3)).toBe(inactiveProfesor);
    expect(service.profesores()).toBe(profesoresBeforeDeactivation);
  });
});
