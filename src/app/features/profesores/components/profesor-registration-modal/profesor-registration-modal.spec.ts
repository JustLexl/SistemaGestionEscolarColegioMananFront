import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  RolesApiError,
  RolesApiService,
  type RolMutationResult,
} from '../../../../pages/roles/roles-api.service';
import { ProfesorRegistrationModal } from './profesor-registration-modal';

describe('ProfesorRegistrationModal con backend', () => {
  let fixture: ComponentFixture<ProfesorRegistrationModal>;
  let registrarRol: ReturnType<typeof vi.fn>;

  const resultado: RolMutationResult = {
    usuario: {
      id: 20,
      nombre: 'Docente Integración',
      puesto: 'Profesores',
      correo: 'integracion@colegio.test',
      estado: 'Activo',
    },
    profesor: { id: 30, usuarioId: 20 },
  };

  beforeEach(async () => {
    registrarRol = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ProfesorRegistrationModal],
      providers: [
        {
          provide: RolesApiService,
          useValue: { registrarRol },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesorRegistrationModal);
    fixture.detectChanges();
  });

  function write(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function completeForm(): void {
    write('#profesor-nombre', 'Docente Integración');
    write('#profesor-correo', 'integracion@colegio.test');
    write('#profesor-cedula', 'CED-INTEGRACION-01');
  }

  it('registra Usuario y Profesor coordinados mediante RolesApiService', async () => {
    registrarRol.mockResolvedValue(resultado);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    completeForm();

    (fixture.nativeElement.querySelector('.registration-modal__save') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(registrarRol).toHaveBeenCalledWith({
      nombre: 'Docente Integración',
      correo: 'integracion@colegio.test',
      cedula: 'CED-INTEGRACION-01',
      puesto: 'Profesores',
      estado: 'Activo',
    });
    expect(closed).toHaveBeenCalledOnce();
  });

  it('mantiene el modal abierto y muestra errores HTTP del backend', async () => {
    registrarRol.mockRejectedValue(new RolesApiError(409, 'El correo ya está registrado.'));
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    completeForm();

    (fixture.nativeElement.querySelector('.registration-modal__save') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El correo ya está registrado.');
    expect(closed).not.toHaveBeenCalled();
  });

  it('impide un segundo envío mientras el registro está pendiente', async () => {
    let resolveRequest!: (value: RolMutationResult) => void;
    registrarRol.mockReturnValue(new Promise<RolMutationResult>((resolve) => {
      resolveRequest = resolve;
    }));
    completeForm();

    const save = fixture.nativeElement.querySelector('.registration-modal__save') as HTMLButtonElement;
    save.click();
    fixture.detectChanges();
    save.click();

    expect(registrarRol).toHaveBeenCalledOnce();
    expect(save.disabled).toBe(true);

    resolveRequest(resultado);
    await fixture.whenStable();
  });
});
