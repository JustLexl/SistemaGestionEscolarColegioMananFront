import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  GradosGruposApiError,
  GradosGruposApiService,
} from './grados-grupos-api.service';
import { GradosGruposComponent } from './grados-grupos.component';
import { CiclosEscolaresApiService } from '../ciclos-escolares/ciclos-escolares-api.service';

describe('GradosGruposComponent', () => {
  let component: GradosGruposComponent;
  let fixture: ComponentFixture<GradosGruposComponent>;
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let ciclosApi: Record<string, ReturnType<typeof vi.fn>>;

  const ciclo = { id: 3, nombre: '2027–2028', fechaInicio: '2027-08-30', fechaFin: '2028-07-14', estado: 'Planeacion' } as const;
  const cicloActivo = { id: 2, nombre: '2026–2027', fechaInicio: '2026-08-31', fechaFin: '2027-07-09', estado: 'Activo' } as const;
  const grado = { id: '8', nombre: '2° Secundaria', nivel: 'Secundaria', numeroGrado: 2, cicloEscolarId: 3, ciclo: ciclo.nombre, cicloEscolar: ciclo } as const;
  const gradoActivo = { id: '7', nombre: '1° Secundaria', nivel: 'Secundaria', numeroGrado: 1, cicloEscolarId: 2, ciclo: cicloActivo.nombre, cicloEscolar: cicloActivo } as const;
  const profesor = {
    id: 3,
    usuarioId: 13,
    nombre: 'Prof. Roberto Carlos Valdés',
    cedula: 'DOC-2021-095',
    estado: 'Activo',
  };
  const grupo = {
    id: 10,
    gradoId: '8',
    gradoNombre: '2° Secundaria',
    grupoLetra: 'Z',
    nombre: '2° Secundaria - Grupo Z',
    clave: 'CM-PRI-6Z-26',
    aula: 'Aula Demo',
    edificio: 'Edificio B',
    turno: 'matutino',
    profesorId: 3,
    profesorNombre: profesor.nombre,
    profesorIniciales: 'RC',
    cedula: profesor.cedula,
    materias: [],
    alumnosActuales: 0,
    alumnosMax: 40,
    estado: 'Activo',
    isBase: false,
    grado,
    cicloEscolarId: 3,
    cicloEscolar: ciclo,
  };

  beforeEach(async () => {
    api = {
      obtenerGrados: vi.fn().mockResolvedValue([grado, gradoActivo]),
      obtenerGrupos: vi.fn().mockResolvedValue([grupo]),
      obtenerProfesoresActivos: vi.fn().mockResolvedValue([profesor]),
      obtenerMetricas: vi.fn().mockResolvedValue({
        total: 1,
        activos: 1,
        gradosCount: 1,
        aulasCount: 1,
        matriculaTotal: 0,
        promedioAlumnos: 0,
      }),
      crearGrado: vi.fn().mockResolvedValue(grado),
      actualizarGrado: vi.fn().mockResolvedValue(grado),
      crearGrupo: vi.fn().mockResolvedValue(grupo),
      actualizarGrupo: vi.fn().mockResolvedValue(grupo),
      cambiarEstadoGrupo: vi.fn().mockResolvedValue({ ...grupo, estado: 'Inactivo' }),
    };
    ciclosApi = { obtenerCiclos: vi.fn().mockResolvedValue([cicloActivo, ciclo]) };

    await TestBed.configureTestingModule({
      imports: [GradosGruposComponent],
      providers: [
        { provide: GradosGruposApiService, useValue: api },
        { provide: CiclosEscolaresApiService, useValue: ciclosApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GradosGruposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await (component as any).cargarDatos();
    fixture.detectChanges();
    vi.clearAllMocks();
  });

  const ui = () => component as any;

  it('renderiza grados, grupos, Profesores y métricas obtenidos', () => {
    expect(fixture.nativeElement.textContent).toContain('2° Secundaria - Grupo Z');
  });

  it('crea un grado y refresca los datos', async () => {
    ui().abrirCrearGrado();
    ui().formGrado.setValue({ nivel: 'Secundaria', numeroGrado: 1, cicloEscolarId: 3 });
    await ui().guardarGrado();
    expect(api['crearGrado']).toHaveBeenCalledWith({
      nivel: 'Secundaria',
      numeroGrado: 1,
      cicloEscolarId: 3,
    });
    expect(api['obtenerGrados']).toHaveBeenCalledOnce();
  });

  it('ofrece Primaria 1°–6° y Secundaria solo 1°–3°', () => {
    ui().abrirCrearGrado();
    expect(ui().numerosGrado()).toEqual([1, 2, 3, 4, 5, 6]);
    ui().formGrado.controls.nivel.setValue('Secundaria');
    ui().cambiarNivel();
    expect(ui().numerosGrado()).toEqual([1, 2, 3]);
  });

  it('muestra únicamente ciclos en Planeación al crear un grado', () => {
    ui().abrirCrearGrado();
    fixture.detectChanges();
    const opciones = [...fixture.nativeElement.querySelectorAll('select[formControlName="cicloEscolarId"] option')]
      .map((option: HTMLOptionElement) => option.textContent?.trim());
    expect(opciones).toEqual(['2027–2028 · Planeación']);
  });

  it('bloquea el ciclo al editar un grado activo', () => {
    ui().abrirEditarGrado(gradoActivo);
    expect(ui().formGrado.controls.cicloEscolarId.disabled).toBe(true);
  });

  it('edita un grado existente', async () => {
    ui().abrirEditarGrado(grado);
    ui().formGrado.controls.numeroGrado.setValue(3);
    await ui().guardarGrado();
    expect(api['actualizarGrado']).toHaveBeenCalledWith(
      '8',
      expect.objectContaining({ numeroGrado: 3, cicloEscolarId: 3 }),
    );
  });

  it('registra un grupo enviando Profesor.id y no usuarioId', async () => {
    ui().abrirCrearGrupo();
    ui().formGrupo.setValue({
      gradoId: '8',
      grupoLetra: 'Z',
      clave: 'CM-PRI-6Z-26',
      aula: 'Aula Demo',
      edificio: 'Edificio B',
      turno: 'matutino',
      profesorId: '3',
      alumnosMax: 40,
      estado: 'Activo',
    });
    await ui().guardarGrupo();
    expect(api['crearGrupo']).toHaveBeenCalledWith(expect.objectContaining({ profesorId: 3 }));
    expect(api['crearGrupo'].mock.calls[0][0]).not.toHaveProperty('usuarioId');
  });

  it('edita un grupo existente', async () => {
    ui().abrirEditarGrupo(grupo);
    ui().formGrupo.controls.aula.setValue('Aula 303');
    await ui().guardarGrupo();
    expect(api['actualizarGrupo']).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ aula: 'Aula 303', profesorId: 3 }),
    );
  });

  it('actualiza el estado mediante toggle y recarga', async () => {
    ui().solicitarCambioEstado(grupo);
    await ui().confirmarCambioEstado();
    expect(api['cambiarEstadoGrupo']).toHaveBeenCalledWith(10);
    expect(api['obtenerGrupos']).toHaveBeenCalledOnce();
  });

  it('muestra el Profesor real en el dropdown', () => {
    ui().abrirCrearGrupo();
    fixture.detectChanges();
    const opciones = [...fixture.nativeElement.querySelectorAll('select[formControlName="profesorId"] option')]
      .map((option: HTMLOptionElement) => option.textContent);
    expect(opciones.join(' ')).toContain('Roberto Carlos Valdés');
  });

  it('muestra el error de Profesor inactivo', async () => {
    api['crearGrupo'].mockRejectedValueOnce(
      new GradosGruposApiError(409, 'El profesor seleccionado está inactivo y no puede asignarse.'),
    );
    ui().abrirCrearGrupo();
    ui().formGrupo.setValue({
      gradoId: '8', grupoLetra: 'Z', clave: 'CM-SEC-2Z-28', aula: 'Aula Demo',
      edificio: 'Edificio B', turno: 'matutino', profesorId: '6', alumnosMax: 40, estado: 'Activo',
    });
    await ui().guardarGrupo();
    expect(ui().error()).toContain('inactivo');
  });

  it('muestra un mensaje claro si el backend está apagado', async () => {
    api['obtenerGrados'].mockRejectedValueOnce(
      new GradosGruposApiError(0, 'No fue posible conectar con el backend escolar.'),
    );
    await ui().cargarDatos();
    expect(ui().error()).toContain('No fue posible conectar');
  });
});
