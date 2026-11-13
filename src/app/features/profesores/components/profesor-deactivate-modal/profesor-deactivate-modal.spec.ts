import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  RolesApiError,
  RolesApiService,
  type RolMutationResult,
} from '../../../../pages/roles/roles-api.service';
import type { Profesor } from '../../models/profesor.model';
import { ProfesoresMockService } from '../../services/profesores-mock.service';
import { ProfesorDeactivateModal } from './profesor-deactivate-modal';

describe('ProfesorDeactivateModal con backend', () => {
  let fixture: ComponentFixture<ProfesorDeactivateModal>;
  let obtenerRolPorId: ReturnType<typeof vi.fn>;
  let cambiarEstado: ReturnType<typeof vi.fn>;

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
    usuario: { ...usuario, estado: 'Inactivo' },
    profesor: { ...profesor, estado: 'Inactivo' },
  };

  beforeEach(async () => {
    obtenerRolPorId = vi.fn().mockResolvedValue(usuario);
    cambiarEstado = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ProfesorDeactivateModal],
      providers: [
        {
          provide: RolesApiService,
          useValue: { obtenerRolPorId, cambiarEstado },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesorDeactivateModal);
    fixture.componentRef.setInput('profesor', profesor);
    fixture.detectChanges();
  });

  it('desactiva de forma coordinada el Usuario y su Profesor', async () => {
    cambiarEstado.mockResolvedValue(resultado);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    (fixture.nativeElement.querySelector('.deactivate-modal__confirm') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(obtenerRolPorId).toHaveBeenCalledWith(20);
    expect(cambiarEstado).toHaveBeenCalledWith(20);
    expect(closed).toHaveBeenCalledOnce();
  });

  it('muestra el error del backend y no cierra el modal', async () => {
    cambiarEstado.mockRejectedValue(new RolesApiError(400, 'No es posible cambiar el estado.'));
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    (fixture.nativeElement.querySelector('.deactivate-modal__confirm') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No es posible cambiar el estado.');
    expect(closed).not.toHaveBeenCalled();
  });

  it('mantiene compatibilidad con profesores legacy sin usuarioId', async () => {
    const legacy: Profesor = {
      id: 1,
      nombre: 'Docente Demo 01',
      cedula: 'DOC-DEMO-001',
      materiasAsignadas: ['Matemáticas'],
      gruposAsignados: ['1.º A'],
      estado: 'Activo',
    };
    fixture.componentRef.setInput('profesor', legacy);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.deactivate-modal__confirm') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(TestBed.inject(ProfesoresMockService).getProfesorById(1)?.estado).toBe('Inactivo');
    expect(obtenerRolPorId).not.toHaveBeenCalled();
    expect(cambiarEstado).not.toHaveBeenCalled();
  });

  it('impide doble envío mientras desactiva', async () => {
    let resolveRequest!: (value: RolMutationResult) => void;
    cambiarEstado.mockReturnValue(new Promise<RolMutationResult>((resolve) => {
      resolveRequest = resolve;
    }));

    const confirm = fixture.nativeElement.querySelector('.deactivate-modal__confirm') as HTMLButtonElement;
    confirm.click();
    await Promise.resolve();
    fixture.detectChanges();
    confirm.click();

    expect(cambiarEstado).toHaveBeenCalledOnce();
    expect(confirm.disabled).toBe(true);

    resolveRequest(resultado);
    await fixture.whenStable();
  });
});
