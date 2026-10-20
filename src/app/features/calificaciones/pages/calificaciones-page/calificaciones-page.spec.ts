import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UiIcon } from '../../../../shared/ui-icon/ui-icon';
import { CalificacionesMockService } from '../../services/calificaciones-mock.service';
import { CalificacionesPage } from './calificaciones-page';

describe('CalificacionesPage', () => {
  let fixture: ComponentFixture<CalificacionesPage>;
  let service: CalificacionesMockService;

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

  function openCreate(): void {
    click('.register-button');
  }

  function fillValidForm(score = '8.7'): void {
    setInput('#cal-alumno', 'Alumno Demo 05');
    setInput('#cal-matricula', 'ALU-DEMO-005');
    setSelect('#cal-grado', '2°');
    setSelect('#cal-grupo', 'A');
    setSelect('#cal-materia', 'Matemáticas');
    setSelect('#cal-periodo', '2° Trimestre');
    setInput('#cal-valor', score);
  }

  function saveForm(): void {
    click('form .button-primary');
  }

  function rows(): HTMLTableRowElement[] {
    return queryAll<HTMLTableRowElement>('tbody tr').filter(
      (row) => !row.querySelector('.empty-state'),
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalificacionesPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CalificacionesPage);
    service = TestBed.inject(CalificacionesMockService);
    fixture.detectChanges();
  });

  it('carga el módulo de Calificaciones con sus datos demo', () => {
    expect(query('h1').textContent).toContain('Calificaciones');
    expect(rows()).toHaveLength(4);
  });

  it('muestra el breadcrumb y contexto de Control Académico', () => {
    expect(query('.breadcrumb').textContent).toContain('Portal');
    expect(query('.breadcrumb').textContent).toContain('Control Académico');
    expect(query('.academic-context__identity').textContent).toContain(
      'Control académico de calificaciones',
    );
  });

  it.each([
    [8, 'score--high'],
    [10, 'score--high'],
    [7.9, 'score--medium'],
    [6.5, 'score--medium'],
    [6.4, 'score--low'],
    [0, 'score--low'],
  ])('presenta %s con el tono %s', (score, expectedClass) => {
    const current = service.getCalificacionById('cal-001')!;
    service.actualizarCalificacion('cal-001', { ...current, calificacion: score });
    fixture.detectChanges();

    expect(rows()[0].querySelector('.score')?.classList.contains(expectedClass)).toBe(true);
  });

  it('reutiliza la clasificación visual en el modal de consulta', () => {
    const current = service.getCalificacionById('cal-001')!;
    service.actualizarCalificacion('cal-001', { ...current, calificacion: 6.4 });
    fixture.detectChanges();
    click('[data-action="view"]');

    expect(query('.detail-modal .score').classList.contains('score--low')).toBe(true);
  });

  it('abre el modal desde Registrar calificación', () => {
    openCreate();

    expect(query('[role="dialog"]')).toBeTruthy();
    expect(query('#form-modal-title').textContent).toContain('Registrar calificación');
  });

  it('registra una calificación válida y agrega una fila', () => {
    openCreate();
    fillValidForm();
    saveForm();

    expect(rows()).toHaveLength(5);
    expect(fixture.nativeElement.textContent).toContain('ALU-DEMO-005');
  });

  it('muestra errores dentro del modal cuando el formulario está vacío', () => {
    openCreate();
    saveForm();

    expect(queryAll('[role="alert"]')).toHaveLength(7);
    expect(query('[role="dialog"]')).toBeTruthy();
  });

  it.each(['-0.1', '10.1', '8.75'])('rechaza la calificación inválida %s', (score) => {
    openCreate();
    fillValidForm(score);
    saveForm();

    expect(rows()).toHaveLength(4);
    expect(query('.form-field__error').textContent).toContain('0 a 10');
  });

  it('rechaza un duplicado lógico con un mensaje claro', () => {
    openCreate();
    setInput('#cal-alumno', 'Otro nombre demo');
    setInput('#cal-matricula', ' alu-demo-001 ');
    setSelect('#cal-grado', '1°');
    setSelect('#cal-grupo', 'A');
    setSelect('#cal-materia', 'Matemáticas');
    setSelect('#cal-periodo', '1er Trimestre');
    setInput('#cal-valor', '9');
    saveForm();

    expect(query('.form-error').textContent).toContain(
      'Ya existe una calificación para este alumno, materia y periodo.',
    );
    expect(rows()).toHaveLength(4);
  });

  it('el ojo muestra el registro correcto en modo de solo lectura', () => {
    click('[data-action="view"]');

    const dialog = query('[role="dialog"]');
    expect(dialog.textContent).toContain('Alumno Demo 01');
    expect(dialog.textContent).toContain('ALU-DEMO-001');
    expect(dialog.querySelector('form')).toBeNull();
  });

  it('el lápiz precarga los datos del registro correcto', () => {
    click('[data-action="edit"]', 1);

    expect(query<HTMLInputElement>('#cal-alumno').value).toBe('Alumno Demo 02');
    expect(query<HTMLInputElement>('#cal-valor').value).toBe('8.5');
    expect(query<HTMLSelectElement>('#cal-materia').value).toBe('Lengua');
  });

  it('guardar una edición actualiza inmediatamente la fila', () => {
    click('[data-action="edit"]');
    setInput('#cal-alumno', 'Alumno Demo 01 Actualizado');
    setInput('#cal-valor', '9.3');
    saveForm();

    expect(service.getCalificacionById('cal-001')?.calificacion).toBe(9.3);
    expect(rows()[0].textContent).toContain('Alumno Demo 01 Actualizado');
    expect(rows()[0].textContent).toContain('9.3');
  });

  it('cancelar una edición conserva los datos originales', () => {
    click('[data-action="edit"]');
    setInput('#cal-alumno', 'Cambio no guardado');
    click('.modal-actions .button-secondary');

    expect(service.getCalificacionById('cal-001')?.alumno).toBe('Alumno Demo 01');
  });

  it('la papelera abre una confirmación sin eliminar al primer clic', () => {
    click('[data-action="delete"]');

    expect(query('#delete-modal-title').textContent).toContain('Eliminar calificación');
    expect(service.total()).toBe(4);
  });

  it('cancelar la eliminación conserva el registro', () => {
    click('[data-action="delete"]');
    click('.delete-modal .button-secondary');

    expect(service.getCalificacionById('cal-001')).toBeDefined();
    expect(rows()).toHaveLength(4);
  });

  it('confirmar la eliminación quita el registro', () => {
    click('[data-action="delete"]');
    click('.button-danger');

    expect(service.getCalificacionById('cal-001')).toBeUndefined();
    expect(rows()).toHaveLength(3);
  });

  it('actualiza los KPIs después de registrar y eliminar', () => {
    openCreate();
    fillValidForm('10');
    saveForm();
    let kpis = queryAll<HTMLElement>('.summary-card__copy strong').map((item) =>
      item.textContent?.trim(),
    );
    expect(kpis).toEqual(['5', '9', '4']);

    click('[data-action="delete"]', 4);
    click('.button-danger');
    kpis = queryAll<HTMLElement>('.summary-card__copy strong').map((item) =>
      item.textContent?.trim(),
    );
    expect(kpis).toEqual(['4', '8.8', '4']);
  });

  it('busca por nombre y matrícula', () => {
    setInput('input[placeholder="Buscar por nombre o matrícula..."]', 'demo 03');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('ALU-DEMO-003');

    setInput('input[placeholder="Buscar por nombre o matrícula..."]', 'alu-demo-004');
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('Alumno Demo 04');
  });

  it.each([
    ['select[aria-label="Filtrar por grado"]', '3°', 'Alumno Demo 03'],
    ['select[aria-label="Filtrar por grupo"]', 'B', 'Alumno Demo 02'],
    ['select[aria-label="Filtrar por materia"]', 'Historia', 'Alumno Demo 03'],
    ['select[aria-label="Filtrar por periodo"]', '1er Trimestre', 'Alumno Demo 01'],
  ])('aplica el filtro %s', (selector, value, expected) => {
    setSelect(selector, value);

    expect(rows().length).toBeGreaterThan(0);
    expect(rows()[0].textContent).toContain(expected);
  });

  it('limpia todos los filtros', () => {
    setInput('input[placeholder="Buscar por nombre o matrícula..."]', 'demo 03');
    setSelect('select[aria-label="Filtrar por grado"]', '3°');
    click('.clear-button');

    expect(rows()).toHaveLength(4);
    expect(
      query<HTMLInputElement>('input[placeholder="Buscar por nombre o matrícula..."]').value,
    ).toBe('');
    expect(query<HTMLSelectElement>('select[aria-label="Filtrar por grado"]').value).toBe('');
  });

  it('combina búsqueda y filtros y actualiza solamente el contador visible', () => {
    setInput('input[placeholder="Buscar por nombre o matrícula..."]', 'Alumno Demo');
    setSelect('select[aria-label="Filtrar por grado"]', '1°');
    setSelect('select[aria-label="Filtrar por grupo"]', 'B');

    expect(rows()).toHaveLength(1);
    expect(query('.registry__count').textContent?.trim()).toBe('1 calificación');
    expect(query('.summary-card__copy strong').textContent?.trim()).toBe('4');
  });

  it('Escape cierra cada tipo de modal', () => {
    for (const selector of [
      '.register-button',
      '[data-action="view"]',
      '[data-action="edit"]',
      '[data-action="delete"]',
    ]) {
      click(selector);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    }
  });

  it('expone nombres accesibles específicos para las acciones', () => {
    expect(query('[data-action="view"]').getAttribute('aria-label')).toBe(
      'Consultar calificación de Alumno Demo 01',
    );
    expect(query('[data-action="edit"]').getAttribute('aria-label')).toBe(
      'Editar calificación de Alumno Demo 01',
    );
    expect(query('[data-action="delete"]').getAttribute('aria-label')).toBe(
      'Eliminar calificación de Alumno Demo 01',
    );
  });

  it('usa edit-simple con un lápiz sin línea inferior', () => {
    const iconDebugElement = fixture.debugElement
      .queryAll((debugElement) => debugElement.componentInstance instanceof UiIcon)
      .find((debugElement) => debugElement.componentInstance.name() === 'edit-simple');
    const paths = Array.from(
      iconDebugElement!.nativeElement.querySelectorAll('path') as NodeListOf<SVGPathElement>,
    );

    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute('d')).toBe('M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z');
    expect(paths.some((path) => path.getAttribute('d') === 'M12 20h9')).toBe(false);
  });
});
