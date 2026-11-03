import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiIcon } from '../../../../shared/ui-icon/ui-icon';
import {
  Calificacion,
  CalificacionDatos,
} from '../../models/calificacion.model';
import {
  AlumnoApi,
  CalificacionesApiError,
  CalificacionesApiService,
  MateriaApi,
} from '../../services/calificaciones-api.service';
import { CalificacionesPage } from './calificaciones-page';

describe('CalificacionesPage', () => {
  let fixture: ComponentFixture<CalificacionesPage>;
  let api: {
    obtenerCalificaciones: ReturnType<typeof vi.fn>;
    obtenerCalificacion: ReturnType<typeof vi.fn>;
    obtenerAlumnos: ReturnType<typeof vi.fn>;
    obtenerMaterias: ReturnType<typeof vi.fn>;
    registrarCalificacion: ReturnType<typeof vi.fn>;
    actualizarCalificacion: ReturnType<typeof vi.fn>;
    eliminarCalificacion: ReturnType<typeof vi.fn>;
  };

  const calificaciones: readonly Calificacion[] = [
    {
      id: 'cal-001',
      alumno: 'Sofía Hernández López',
      matricula: 'CM-2026-001',
      grado: '4°',
      grupo: 'A',
      materia: 'Matemáticas IV',
      periodo: '1er Trimestre',
      calificacion: 9.2,
    },
    {
      id: 'cal-002',
      alumno: 'Mateo García Pérez',
      matricula: 'CM-2026-002',
      grado: '4°',
      grupo: 'B',
      materia: 'Lengua Materna (Español IV)',
      periodo: '1er Trimestre',
      calificacion: 8.5,
    },
  ];

  const alumnos: readonly AlumnoApi[] = [
    {
      id: 1,
      matricula: 'CM-2026-001',
      nombre: 'Sofía Hernández López',
      grado: '4° Primaria',
      grupo: 'Grupo A',
    },
    {
      id: 2,
      matricula: 'CM-2026-002',
      nombre: 'Mateo García Pérez',
      grado: '4° Primaria',
      grupo: 'Grupo B',
    },
    {
      id: 3,
      matricula: 'CM-2026-003',
      nombre: 'Valentina Martínez Ruiz',
      grado: '3° Primaria',
      grupo: 'Grupo A',
    },
  ];

  const materias: readonly MateriaApi[] = [
    { id: 1, nombre: 'Matemáticas IV' },
    { id: 2, nombre: 'Lengua Materna (Español IV)' },
  ];

  const query = <T extends Element>(selector: string): T =>
    fixture.nativeElement.querySelector(selector) as T;
  const queryAll = <T extends Element>(selector: string): T[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector)) as T[];

  function click(selector: string, index = 0): void {
    queryAll<HTMLButtonElement>(selector)[index].click();
    fixture.detectChanges();
  }

  function setInput(selector: string, value: string): void {
    const input = query<HTMLInputElement>(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setSelect(selector: string, value: string): void {
    const select = query<HTMLSelectElement>(selector);
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function rows(): HTMLTableRowElement[] {
    return queryAll<HTMLTableRowElement>('tbody tr').filter(
      (row) => !row.querySelector('.empty-state'),
    );
  }

  async function settle(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(CalificacionesPage);
    fixture.detectChanges();
    await settle();
  }

  beforeEach(async () => {
    api = {
      obtenerCalificaciones: vi.fn().mockResolvedValue(calificaciones),
      obtenerCalificacion: vi
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(calificaciones.find((item) => item.id === id)),
        ),
      obtenerAlumnos: vi.fn().mockResolvedValue(alumnos),
      obtenerMaterias: vi.fn().mockResolvedValue(materias),
      registrarCalificacion: vi.fn(),
      actualizarCalificacion: vi.fn(),
      eliminarCalificacion: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [CalificacionesPage],
      providers: [
        provideRouter([]),
        { provide: CalificacionesApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('carga calificaciones, alumnos y materias desde la API', async () => {
    await createComponent();

    expect(api.obtenerCalificaciones).toHaveBeenCalledOnce();
    expect(api.obtenerAlumnos).toHaveBeenCalledOnce();
    expect(api.obtenerMaterias).toHaveBeenCalledOnce();
    expect(rows()).toHaveLength(2);
    expect(query('.summary-card__copy strong').textContent?.trim()).toBe('2');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    api.obtenerCalificaciones.mockRejectedValueOnce(
      new CalificacionesApiError(0, 'Backend no disponible.'),
    );
    await createComponent();

    expect(query('[role="alert"]').textContent).toContain(
      'Backend no disponible.',
    );

    click('.empty-state button');
    await settle();

    expect(api.obtenerCalificaciones).toHaveBeenCalledTimes(2);
    expect(rows()).toHaveLength(2);
  });

  it('usa los catálogos reales y completa alumno, matrícula, grado y grupo', async () => {
    await createComponent();
    click('.register-button');

    const studentOptions = queryAll<HTMLOptionElement>(
      '#cal-alumno option',
    ).map((item) => item.textContent?.trim());
    const subjectOptions = queryAll<HTMLOptionElement>(
      '#cal-materia option',
    ).map((item) => item.textContent?.trim());
    expect(studentOptions).toContain('Valentina Martínez Ruiz — CM-2026-003');
    expect(subjectOptions).toContain('Matemáticas IV');

    setSelect('#cal-alumno', 'CM-2026-003');

    expect(query<HTMLInputElement>('#cal-matricula').value).toBe('CM-2026-003');
    expect(query<HTMLInputElement>('#cal-grado').value).toBe('3°');
    expect(query<HTMLInputElement>('#cal-grupo').value).toBe('A');
  });

  it('registra mediante la API y agrega la respuesta real a la tabla', async () => {
    const created: Calificacion = {
      id: 'cal-003',
      alumno: 'Valentina Martínez Ruiz',
      matricula: 'CM-2026-003',
      grado: '3°',
      grupo: 'A',
      materia: 'Matemáticas IV',
      periodo: '2° Trimestre',
      calificacion: 8.7,
    };
    api.registrarCalificacion.mockResolvedValue(created);
    await createComponent();
    click('.register-button');
    setSelect('#cal-alumno', created.matricula);
    setSelect('#cal-materia', created.materia);
    setSelect('#cal-periodo', created.periodo);
    setInput('#cal-valor', String(created.calificacion));

    click('form .button-primary');
    await settle();

    expect(api.registrarCalificacion).toHaveBeenCalledWith({
      alumno: created.alumno,
      matricula: created.matricula,
      grado: created.grado,
      grupo: created.grupo,
      materia: created.materia,
      periodo: created.periodo,
      calificacion: created.calificacion,
    } satisfies CalificacionDatos);
    expect(rows()).toHaveLength(3);
    expect(fixture.nativeElement.textContent).toContain(
      'Valentina Martínez Ruiz',
    );
  });

  it('muestra el conflicto 409 del backend sin cerrar el formulario', async () => {
    api.registrarCalificacion.mockRejectedValue(
      new CalificacionesApiError(409, 'Ya existe una calificación.'),
    );
    await createComponent();
    click('.register-button');
    setSelect('#cal-alumno', 'CM-2026-001');
    setSelect('#cal-materia', 'Matemáticas IV');
    setSelect('#cal-periodo', '1er Trimestre');
    setInput('#cal-valor', '9');

    click('form .button-primary');
    await settle();

    expect(query('.form-error').textContent).toContain(
      'Ya existe una calificación para este alumno, materia y periodo.',
    );
    expect(query('[role="dialog"]')).toBeTruthy();
  });

  it('actualiza mediante la API y sustituye la fila correspondiente', async () => {
    const updated = { ...calificaciones[0], calificacion: 9.8 };
    api.actualizarCalificacion.mockResolvedValue(updated);
    await createComponent();
    click('[data-action="edit"]');
    setInput('#cal-valor', '9.8');

    click('form .button-primary');
    await settle();

    expect(api.actualizarCalificacion).toHaveBeenCalledWith(
      'cal-001',
      expect.objectContaining({ calificacion: 9.8 }),
    );
    expect(rows()[0].textContent).toContain('9.8');
  });

  it('consulta el detalle actualizado mediante la API', async () => {
    const detail = { ...calificaciones[0], calificacion: 9.6 };
    api.obtenerCalificacion.mockResolvedValue(detail);
    await createComponent();

    click('[data-action="view"]');
    await settle();

    expect(api.obtenerCalificacion).toHaveBeenCalledWith('cal-001');
    expect(query('.detail-modal .score').textContent?.trim()).toBe('9.6');
  });

  it('elimina mediante la API solamente después de confirmar', async () => {
    await createComponent();
    click('[data-action="delete"]');
    expect(api.eliminarCalificacion).not.toHaveBeenCalled();

    click('.button-danger');
    await settle();

    expect(api.eliminarCalificacion).toHaveBeenCalledWith('cal-001');
    expect(rows()).toHaveLength(1);
  });

  it('mantiene el modal abierto cuando falla una operación', async () => {
    api.eliminarCalificacion.mockRejectedValue(
      new CalificacionesApiError(500, 'No se pudo eliminar.'),
    );
    await createComponent();
    click('[data-action="delete"]');

    click('.button-danger');
    await settle();

    expect(query('.delete-modal [role="alert"]').textContent).toContain(
      'No se pudo eliminar.',
    );
    expect(query('.delete-modal')).toBeTruthy();
    expect(rows()).toHaveLength(2);
  });

  it('filtra localmente los datos obtenidos del backend', async () => {
    await createComponent();

    setInput('input[placeholder="Buscar por nombre o matrícula..."]', 'mateo');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('CM-2026-002');

    setInput('input[placeholder="Buscar por nombre o matrícula..."]', '');
    setSelect('select[aria-label="Filtrar por grupo"]', 'A');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('Sofía Hernández López');
  });

  it('conserva el lápiz simple independiente para editar', async () => {
    await createComponent();

    const iconDebugElement = fixture.debugElement
      .queryAll(
        (debugElement) => debugElement.componentInstance instanceof UiIcon,
      )
      .find(
        (debugElement) =>
          debugElement.componentInstance.name() === 'edit-simple',
      );
    const paths = Array.from(
      iconDebugElement!.nativeElement.querySelectorAll(
        'path',
      ) as NodeListOf<SVGPathElement>,
    );

    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute('d')).toBe(
      'M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z',
    );
    expect(paths.some((path) => path.getAttribute('d') === 'M12 20h9')).toBe(
      false,
    );
  });
});
