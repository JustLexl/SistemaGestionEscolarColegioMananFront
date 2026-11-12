import { ComponentFixture, TestBed } from '@angular/core/testing';
import { routes } from '../../app.routes';
import { MateriasApiError, MateriasApiService } from './materias-api.service';
import { MateriasComponent } from './materias.component';

describe('MateriasComponent', () => {
  let component: MateriasComponent;
  let fixture: ComponentFixture<MateriasComponent>;
  let api: Record<string, ReturnType<typeof vi.fn>>;

  const finalizado = { id: 1, nombre: '2024–2025', fechaInicio: '2024-08-26', fechaFin: '2025-07-11', estado: 'Finalizado' } as const;
  const activo = { id: 2, nombre: '2026–2027', fechaInicio: '2026-08-31', fechaFin: '2027-07-09', estado: 'Activo' } as const;
  const planeacion = { id: 3, nombre: '2027–2028', fechaInicio: '2027-08-30', fechaFin: '2028-07-14', estado: 'Planeacion' } as const;
  const gradoActivo = { id: '7', nombre: '1° Secundaria', nivel: 'Secundaria', numeroGrado: 1, cicloEscolarId: 2, ciclo: activo.nombre, cicloEscolar: activo } as const;
  const gradoPlaneado = { id: '8', nombre: '2° Secundaria', nivel: 'Secundaria', numeroGrado: 2, cicloEscolarId: 3, ciclo: planeacion.nombre, cicloEscolar: planeacion } as const;
  const profesor = { id: 3, nombre: 'Prof. Roberto Carlos Valdés', cedula: 'DOC-2021-095', estado: 'Activo' } as const;
  const profesorDos = { id: 5, nombre: 'Prof. Alfonso Reyes Ochoa', cedula: 'DOC-2022-073', estado: 'Activo' } as const;
  const profesorInactivo = { id: 6, nombre: 'Profra. Sofía Ramírez', cedula: 'DOC-2020-031', estado: 'Inactivo' } as const;
  const grupoActivo = {
    id: 10, gradoId: '7', gradoNombre: gradoActivo.nombre, grupoLetra: 'A',
    nombre: '1° Secundaria - Grupo A', clave: 'CM-SEC-1A-26', aula: 'S-101',
    edificio: 'Secundaria', turno: 'matutino', profesorId: 3,
    profesorNombre: profesor.nombre, profesorIniciales: 'RV', cedula: profesor.cedula,
    materias: [], alumnosActuales: 28, alumnosMax: 35, estado: 'Activo', isBase: false,
    grado: gradoActivo, cicloEscolarId: 2, cicloEscolar: activo,
  } as const;
  const grupoPlaneado = {
    ...grupoActivo, id: 11, gradoId: '8', gradoNombre: gradoPlaneado.nombre,
    grupoLetra: 'B', nombre: '2° Secundaria - Grupo B', clave: 'CM-SEC-2B-28',
    grado: gradoPlaneado, cicloEscolarId: 3, cicloEscolar: planeacion,
  } as const;
  const materiaActiva = {
    id: 20, codigo: 'DEM', nombre: 'Materia Demo', claveSep: 'DEM-SEC-01',
    cargaHoraria: '4 hrs/sem', grupoIds: [10], profesorId: 3, estado: 'Activa',
    isTroncoComun: true,
    grupos: [{ id: 10, nombre: grupoActivo.nombre, grupoLetra: 'A', gradoId: '7', gradoNombre: gradoActivo.nombre }],
    grados: [{ id: '7', nombre: gradoActivo.nombre, nivel: 'Secundaria', numeroGrado: 1 }],
    cicloEscolar: activo, profesor, gruposCount: 1,
  } as const;
  const materiaHistorica = {
    ...materiaActiva, id: 1, codigo: 'MAT', nombre: 'Matemáticas IV',
    claveSep: 'MAT-PRI-04', cicloEscolar: finalizado,
  } as const;

  beforeEach(async () => {
    api = {
      obtenerMaterias: vi.fn().mockResolvedValue([materiaActiva, materiaHistorica]),
      obtenerMetricas: vi.fn().mockResolvedValue({
        total: 2, activas: 2, enPlaneacion: 0, inactivas: 0,
        profesoresAsignados: 1, gruposConMaterias: 1,
      }),
      obtenerCiclos: vi.fn().mockResolvedValue([finalizado, activo, planeacion]),
      obtenerGrupos: vi.fn().mockResolvedValue([grupoActivo, grupoPlaneado]),
      obtenerProfesores: vi.fn().mockResolvedValue([profesor, profesorDos, profesorInactivo]),
      crearMateria: vi.fn().mockResolvedValue(materiaActiva),
      actualizarMateria: vi.fn().mockResolvedValue(materiaActiva),
      darDeBaja: vi.fn().mockResolvedValue({ ...materiaActiva, estado: 'Inactiva' }),
    };
    await TestBed.configureTestingModule({
      imports: [MateriasComponent],
      providers: [{ provide: MateriasApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(MateriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await (component as any).cargarDatos();
    fixture.detectChanges();
    vi.clearAllMocks();
  });

  const ui = () => component as any;

  it('registra la ruta /materias', () => {
    const shell = routes.find((route) => route.path === '');
    expect(shell?.children?.some((route) => route.path === 'materias')).toBe(true);
  });

  it('carga Materias, métricas, ciclos, grupos y Profesores desde API', async () => {
    await ui().cargarDatos();
    expect(api['obtenerMaterias']).toHaveBeenCalledOnce();
    expect(api['obtenerMetricas']).toHaveBeenCalledOnce();
    expect(api['obtenerCiclos']).toHaveBeenCalledOnce();
    expect(api['obtenerGrupos']).toHaveBeenCalledOnce();
    expect(api['obtenerProfesores']).toHaveBeenCalledOnce();
  });

  it('renderiza la tabla de Materias con relaciones reales', () => {
    expect(fixture.nativeElement.textContent).toContain('Materia Demo');
    expect(fixture.nativeElement.textContent).toContain('Roberto Carlos Valdés');
  });

  it('busca por nombre y clave SEP', () => {
    ui().busqueda.set('matemáticas');
    expect(ui().materiasFiltradas().map((materia: any) => materia.id)).toEqual([1]);
    ui().busqueda.set('DEM-SEC');
    expect(ui().materiasFiltradas().map((materia: any) => materia.id)).toEqual([20]);
  });

  it('filtra por ciclo escolar', () => {
    ui().filtroCiclo.set('1');
    expect(ui().materiasFiltradas()).toEqual([materiaHistorica]);
  });

  it('filtra por Grado real', () => {
    ui().filtroGrado.set('7');
    expect(ui().materiasFiltradas().length).toBe(2);
    ui().filtroGrado.set('999');
    expect(ui().materiasFiltradas()).toEqual([]);
  });

  it('filtra por Profesor.id', () => {
    ui().filtroProfesor.set('3');
    expect(ui().materiasFiltradas().length).toBe(2);
    ui().filtroProfesor.set('5');
    expect(ui().materiasFiltradas()).toEqual([]);
  });

  it('filtra por estado', () => {
    ui().filtroEstado.set('Inactiva');
    expect(ui().materiasFiltradas()).toEqual([]);
  });

  it('muestra el ciclo activo obtenido desde API', () => {
    expect(ui().cicloActivo().nombre).toBe('2026–2027');
    expect(fixture.nativeElement.textContent).toContain('Ciclo activo: 2026–2027');
  });

  it('al crear sólo ofrece ciclos Activo y Planeación', () => {
    ui().abrirCrear();
    fixture.detectChanges();
    const opciones = [...fixture.nativeElement.querySelectorAll('select[formControlName="cicloEscolarId"] option')]
      .map((option: HTMLOptionElement) => option.textContent?.trim());
    expect(opciones.join(' ')).toContain('2026–2027');
    expect(opciones.join(' ')).toContain('2027–2028');
    expect(opciones.join(' ')).not.toContain('2024–2025');
  });

  it('el ciclo seleccionado limita los Grupos disponibles', () => {
    ui().abrirCrear();
    expect(ui().gruposFormulario().map((grupo: any) => grupo.id)).toEqual([10]);
    ui().formulario.controls.cicloEscolarId.setValue('3');
    ui().cambiarCiclo();
    expect(ui().gruposFormulario().map((grupo: any) => grupo.id)).toEqual([11]);
  });

  it('cambiar de ciclo limpia la multiselección previa', () => {
    ui().abrirCrear();
    ui().formulario.controls.grupoIds.setValue([10]);
    ui().formulario.controls.cicloEscolarId.setValue('3');
    ui().cambiarCiclo();
    expect(ui().formulario.controls.grupoIds.value).toEqual([]);
  });

  it('permite seleccionar múltiples Grupos y múltiples Grados', () => {
    ui().formulario.controls.grupoIds.setValue([10, 11]);
    expect(ui().formulario.controls.grupoIds.value).toEqual([10, 11]);
  });

  it('ofrece sólo Profesores activos para nuevas asignaciones', () => {
    expect(ui().profesoresActivos().map((item: any) => item.id)).toEqual([3, 5]);
  });

  it('crea Materia enviando grupoIds y nunca gruposAsignados', async () => {
    ui().abrirCrear();
    ui().formulario.setValue({
      nombre: 'Materia Demo', codigo: 'DEM', claveSep: 'DEM-SEC-02',
      cargaHoraria: '4 hrs/sem', cicloEscolarId: '2', grupoIds: [10],
      profesorId: '3', estado: 'Activa', isTroncoComun: true,
    });
    await ui().guardar();
    const payload = api['crearMateria'].mock.calls[0][0];
    expect(payload.grupoIds).toEqual([10]);
    expect(payload).not.toHaveProperty('gruposAsignados');
    expect(payload).not.toHaveProperty('gradoId');
  });

  it('edita una Materia y bloquea Grupos del ciclo Activo', async () => {
    ui().abrirEditar(materiaActiva);
    expect(ui().formulario.controls.grupoIds.disabled).toBe(true);
    ui().formulario.controls.cargaHoraria.setValue('6 hrs/sem');
    await ui().guardar();
    expect(api['actualizarMateria']).toHaveBeenCalledWith(
      20,
      expect.objectContaining({ cargaHoraria: '6 hrs/sem', grupoIds: [10] }),
    );
  });

  it('bloquea completamente la edición histórica', () => {
    ui().abrirEditar(materiaHistorica);
    expect(ui().formulario.disabled).toBe(true);
  });

  it('da de baja mediante PATCH y recarga datos', async () => {
    await ui().darDeBaja(materiaActiva);
    expect(api['darDeBaja']).toHaveBeenCalledWith(20);
    expect(api['obtenerMaterias']).toHaveBeenCalledOnce();
  });

  it('abre consulta con datos de ciclo, Grados, Grupos y cédula', () => {
    ui().abrirConsulta(materiaActiva);
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Consultar materia');
    expect(texto).toContain('1° Secundaria');
    expect(texto).toContain('DOC-2021-095');
  });

  it('renderiza KPIs verificables sin alumnos simulados', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Total materias');
    expect(texto).toContain('Profesores asignados');
    expect(texto).toContain('Grupos con materias');
    expect(texto).not.toContain('Alumnos impactados');
  });

  it('incluye contenedores responsive para tabla y modal', () => {
    expect(fixture.nativeElement.querySelector('.cm-table-scroll')).toBeTruthy();
    ui().abrirCrear();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.modal-card')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.groups-select')).toBeTruthy();
  });

  it('muestra errores controlados del backend', async () => {
    api['obtenerMaterias'].mockRejectedValueOnce(new MateriasApiError(0, 'Backend no disponible.'));
    await ui().cargarDatos();
    expect(ui().error()).toContain('Backend no disponible');
  });
});
