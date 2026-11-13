import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  RolesApiError,
  RolesApiService,
  type RolMutationResult,
} from '../../../../pages/roles/roles-api.service';
import type { Profesor } from '../../models/profesor.model';
import { ProfesorEditModal } from './profesor-edit-modal';

describe('ProfesorEditModal con backend', () => {
  let fixture: ComponentFixture<ProfesorEditModal>;
  let obtenerRolPorId: ReturnType<typeof vi.fn>;
  let actualizarRol: ReturnType<typeof vi.fn>;

  const profesor: Profesor = {
    id: 30,
    usuarioId: 20,
    nombre: 'Docente Integración',
    cedula: 'CED-INTEGRACION-01',
    materiasAsignadas: ['Matemáticas'],
    gruposAsignados: ['1.º A'],
    estado: 'Activo',
  };

  const usuario = {
    id: 20,
    nombre: profesor.nombre,
    puesto: 'Profesores' as const,
    correo: 'integracion@colegio.test',
    estado: 'Activo' as const,
  };

  const resultado: RolMutationResult = {
    usuario: { ...usuario, nombre: 'Docente Actualizado' },
    profesor: { ...profesor, nombre: 'Docente Actualizado' },
  };

  beforeEach(async () => {
    obtenerRolPorId = vi.fn().mockResolvedValue(usuario);
    actualizarRol = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ProfesorEditModal],
      providers: [
        {
          provide: RolesApiService,
          useValue: { obtenerRolPorId, actualizarRol },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesorEditModal);
    fixture.componentRef.setInput('profesor', profesor);
    fixture.detectChanges();
  });

  function write(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('actualiza el Usuario relacionado conservando correo, puesto y estado', async () => {
    actualizarRol.mockResolvedValue(resultado);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    write('#editar-profesor-nombre', 'Docente Actualizado');
    write('#editar-profesor-cedula', 'CED-INTEGRACION-02');

    (fixture.nativeElement.querySelector('.edit-modal__save') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(obtenerRolPorId).toHaveBeenCalledWith(20);
    expect(actualizarRol).toHaveBeenCalledWith(20, {
      nombre: 'Docente Actualizado',
      cedula: 'CED-INTEGRACION-02',
      correo: usuario.correo,
      puesto: 'Profesores',
      estado: 'Activo',
    });
    expect(closed).toHaveBeenCalledOnce();
  });

  it('muestra un conflicto de cédula y no cierra el modal', async () => {
    actualizarRol.mockRejectedValue(new RolesApiError(409, 'La cédula ya está en uso.'));
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    write('#editar-profesor-cedula', 'CED-DUPLICADA');

    (fixture.nativeElement.querySelector('.edit-modal__save') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ya existe un profesor con esta cédula.');
    expect(closed).not.toHaveBeenCalled();
  });

  it('muestra errores 404 del backend y conserva el formulario', async () => {
    obtenerRolPorId.mockRejectedValue(new RolesApiError(404, 'El usuario relacionado no existe.'));
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    (fixture.nativeElement.querySelector('.edit-modal__save') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El usuario relacionado no existe.');
    expect(closed).not.toHaveBeenCalled();
  });

  it('impide doble envío mientras actualiza', async () => {
    let resolveRequest!: (value: RolMutationResult) => void;
    actualizarRol.mockReturnValue(new Promise<RolMutationResult>((resolve) => {
      resolveRequest = resolve;
    }));

    const save = fixture.nativeElement.querySelector('.edit-modal__save') as HTMLButtonElement;
    save.click();
    await Promise.resolve();
    fixture.detectChanges();
    save.click();

    expect(actualizarRol).toHaveBeenCalledOnce();
    expect(save.disabled).toBe(true);

    resolveRequest(resultado);
    await fixture.whenStable();
  });
});
