import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RolesApiService } from './roles-api.service';
import { Rol, RolesComponent } from './roles.component';

describe('RolesComponent', () => {
  let fixture: ComponentFixture<RolesComponent>;
  let component: RolesComponent;
  let api: {
    obtenerRoles: ReturnType<typeof vi.fn>;
    registrarRol: ReturnType<typeof vi.fn>;
    actualizarRol: ReturnType<typeof vi.fn>;
    cambiarEstado: ReturnType<typeof vi.fn>;
    eliminarRol: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      obtenerRoles: vi.fn().mockResolvedValue([]),
      registrarRol: vi.fn(),
      actualizarRol: vi.fn(),
      cambiarEstado: vi.fn(),
      eliminarRol: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RolesComponent],
      providers: [
        provideRouter([]),
        { provide: RolesApiService, useValue: api },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  async function abrirRegistro(): Promise<void> {
    component.openRolModal();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('muestra el campo Cédula cuando el rol es Profesores', async () => {
    await abrirRegistro();
    expect(fixture.nativeElement.querySelector('#rol-cedula')).not.toBeNull();
  });

  it('oculta el campo Cédula cuando el rol cambia a Directivos', async () => {
    await abrirRegistro();
    const select = fixture.nativeElement.querySelector('select[name="puesto"]') as HTMLSelectElement;
    select.value = 'Directivos';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#rol-cedula')).toBeNull();
  });

  it('oculta el campo Cédula cuando el rol cambia a Administrativo', async () => {
    await abrirRegistro();
    const select = fixture.nativeElement.querySelector('select[name="puesto"]') as HTMLSelectElement;
    select.value = 'Administrativo';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#rol-cedula')).toBeNull();
  });

  it('exige Cédula antes de registrar un usuario Profesor', async () => {
    await abrirRegistro();
    component.rolForm.nombre = 'Profesor Sin Cédula';
    component.rolForm.correo = 'sin.cedula@manantial.edu.mx';
    component.rolForm.cedula = '   ';

    await component.saveRol();

    expect(api.registrarRol).not.toHaveBeenCalled();
    expect(component.toastMessage).toContain('cédula es obligatoria');
  });

  it('agrega a la lista el usuario devuelto por el backend', async () => {
    const usuario: Rol = {
      id: 13,
      nombre: 'Profesor Relacionado Demo',
      puesto: 'Profesores',
      correo: 'profesor.relacionado.demo@manantial.edu.mx',
      estado: 'Activo',
    };
    api.registrarRol.mockResolvedValue({
      usuario,
      profesor: { id: 8, usuarioId: 13 },
    });
    await abrirRegistro();
    component.rolForm = {
      nombre: usuario.nombre,
      puesto: usuario.puesto,
      correo: usuario.correo,
      cedula: 'DOC-DEMO-REL-001',
      estado: usuario.estado,
    };

    await component.saveRol();

    expect(api.registrarRol).toHaveBeenCalledWith({
      nombre: usuario.nombre,
      puesto: 'Profesores',
      correo: usuario.correo,
      estado: 'Activo',
      cedula: 'DOC-DEMO-REL-001',
    });
    expect(component.roles).toEqual([usuario]);
    expect(component.isRolModalOpen).toBe(false);
  });
});
