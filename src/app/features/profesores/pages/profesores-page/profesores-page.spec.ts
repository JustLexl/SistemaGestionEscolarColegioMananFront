import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ProfesoresTable } from '../../components/profesores-table/profesores-table';
import { ProfesoresMockService } from '../../services/profesores-mock.service';
import { ProfesoresPage } from './profesores-page';

describe('ProfesoresPage', () => {
  let fixture: ComponentFixture<ProfesoresPage>;
  let service: ProfesoresMockService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfesoresPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesoresPage);
    service = TestBed.inject(ProfesoresMockService);
    fixture.detectChanges();
  });

  function compiled(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function click(selector: string): void {
    const button = compiled().querySelector<HTMLButtonElement>(selector);
    expect(button).not.toBeNull();
    button?.click();
    fixture.detectChanges();
  }

  function write(selector: string, value: string): void {
    const input = compiled().querySelector<HTMLInputElement>(selector);
    expect(input).not.toBeNull();
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
  }

  function openRegistration(): void {
    click('.register-button');
  }

  function saveRegistration(): void {
    click('.registration-modal__save');
  }

  function openDetail(rowIndex = 0): void {
    const buttons = compiled().querySelectorAll<HTMLButtonElement>('.actions__view');
    expect(buttons.length).toBeGreaterThan(rowIndex);
    buttons.item(rowIndex).click();
    fixture.detectChanges();
  }

  function detailText(): string {
    return compiled().querySelector('.detail-modal')?.textContent ?? '';
  }

  function registerDemo04(): void {
    openRegistration();
    write('#profesor-nombre', 'Docente Demo 04');
    write('#profesor-cedula', 'DOC-DEMO-004');
    saveRegistration();
  }

  function openEdit(rowIndex = 0): void {
    const buttons = compiled().querySelectorAll<HTMLButtonElement>('.actions__edit');
    expect(buttons.length).toBeGreaterThan(rowIndex);
    buttons.item(rowIndex).click();
    fixture.detectChanges();
  }

  function saveEdit(): void {
    click('.edit-modal__save');
  }

  function openDeactivation(rowIndex = 0): void {
    const buttons = compiled().querySelectorAll<HTMLButtonElement>('.actions__danger');
    expect(buttons.length).toBeGreaterThan(rowIndex);
    buttons.item(rowIndex).click();
    fixture.detectChanges();
  }

  function confirmDeactivation(): void {
    click('.deactivate-modal__confirm');
  }

  it('should render the profesores base layout', () => {
    expect(compiled().querySelector('h1')?.textContent).toContain('Profesores');
    expect(compiled().textContent).toContain('Padrón de profesores');
    expect(compiled().textContent).toContain('Registrar profesor');
  });

  it('should render the profesores supplied by the service', () => {
    expect(compiled().querySelectorAll('tbody tr')).toHaveLength(service.profesores().length);
    expect(compiled().textContent).toContain('Docente Demo 01');
    expect(compiled().textContent).toContain('DOC-DEMO-001');
  });

  it('should show counters that match the service collection length', () => {
    expect(compiled().querySelector('.registry__count')?.textContent).toContain('3 profesores');
    expect(compiled().querySelector('.summary-card strong')?.textContent).toContain('3');
    expect(compiled().querySelector('.pagination > span')?.textContent).toContain('1–3 de 3');
  });

  it('should expose complete teacher data and a specific action label', () => {
    const firstProfesor = service.profesores()[0];
    const teacher = compiled().querySelector('.teacher');
    const actions = compiled().querySelector('.actions');

    expect(teacher?.querySelector('strong')?.getAttribute('title')).toBe(firstProfesor.nombre);
    expect(teacher?.querySelector(':scope > div > span')?.getAttribute('title')).toBe(
      firstProfesor.cedula,
    );
    expect(actions?.getAttribute('aria-label')).toBe(`Acciones para ${firstProfesor.nombre}`);
  });

  it('should open the registration modal from the register button', () => {
    openRegistration();

    expect(compiled().querySelector('[role="dialog"]')).not.toBeNull();
    expect(compiled().querySelector('#registration-modal-title')?.textContent).toContain(
      'Registrar profesor',
    );
  });

  it('should close on cancel without registering a profesor', () => {
    const initialLength = service.profesores().length;
    openRegistration();
    write('#profesor-nombre', 'Profesor cancelado');
    write('#profesor-cedula', 'DOC-CANCELADO');

    click('.registration-modal__cancel');

    expect(service.profesores()).toHaveLength(initialLength);
    expect(compiled().querySelector('[role="dialog"]')).toBeNull();
  });

  it('should not register an invalid empty form', () => {
    const initialLength = service.profesores().length;
    openRegistration();

    saveRegistration();

    expect(service.profesores()).toHaveLength(initialLength);
    expect(compiled().querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('should show the required name error', () => {
    openRegistration();
    write('#profesor-cedula', 'DOC-DEMO-004');

    saveRegistration();

    expect(compiled().textContent).toContain('El nombre es obligatorio.');
  });

  it('should show the required cedula error', () => {
    openRegistration();
    write('#profesor-nombre', 'Docente Demo 04');

    saveRegistration();

    expect(compiled().textContent).toContain('La cédula es obligatoria.');
  });

  it('should show an error and reject a duplicate cedula', () => {
    const initialLength = service.profesores().length;
    openRegistration();
    write('#profesor-nombre', 'Profesor duplicado');
    write('#profesor-cedula', '  doc-demo-001  ');

    saveRegistration();

    expect(compiled().textContent).toContain('Ya existe un profesor con esta cédula.');
    expect(service.profesores()).toHaveLength(initialLength);
  });

  it('should add a row and update counters after a valid registration', () => {
    openRegistration();
    write('#profesor-nombre', '  Docente Demo 04  ');
    write('#profesor-cedula', '  DOC-DEMO-004  ');

    saveRegistration();

    expect(compiled().querySelectorAll('tbody tr')).toHaveLength(4);
    expect(compiled().textContent).toContain('Docente Demo 04');
    expect(compiled().textContent).toContain('DOC-DEMO-004');
    expect(compiled().querySelector('.registry__count')?.textContent).toContain('4 profesores');
    expect(compiled().querySelector('.summary-card strong')?.textContent).toContain('4');
  });

  it('should close the modal after a valid registration', () => {
    openRegistration();
    write('#profesor-nombre', 'Docente Demo 04');
    write('#profesor-cedula', 'DOC-DEMO-004');

    saveRegistration();

    expect(compiled().querySelector('[role="dialog"]')).toBeNull();
  });

  it('should open the detail modal from an accessible consultation button', () => {
    const firstButton = compiled().querySelector<HTMLButtonElement>('.actions__view');
    expect(firstButton?.getAttribute('aria-label')).toBe('Consultar profesor Docente Demo 01');

    openDetail();

    expect(compiled().querySelector('.detail-modal[role="dialog"]')).not.toBeNull();
    expect(compiled().querySelector('#detail-modal-title')?.textContent).toContain(
      'Información del profesor',
    );
  });

  it('should show the profesor that belongs to the selected row', () => {
    openDetail(1);

    expect(detailText()).toContain('Docente Demo 02');
    expect(detailText()).toContain('DOC-DEMO-002');
    expect(detailText()).not.toContain('Docente Demo 01');
  });

  it('should show the selected profesor name', () => {
    openDetail();

    expect(detailText()).toContain('Docente Demo 01');
  });

  it('should show the selected profesor cedula', () => {
    openDetail();

    expect(detailText()).toContain('DOC-DEMO-001');
  });

  it('should show the selected profesor status', () => {
    openDetail(2);

    expect(compiled().querySelector('.detail-modal .status')?.textContent).toContain('Inactivo');
  });

  it('should show the existing subjects', () => {
    openDetail();

    expect(detailText()).toContain('Matemáticas');
    expect(detailText()).toContain('Física');
  });

  it('should show the existing groups', () => {
    openDetail(1);

    expect(detailText()).toContain('3.º A');
    expect(detailText()).toContain('3.º B');
  });

  it('should show the empty subjects message for a newly registered profesor', () => {
    registerDemo04();
    openDetail(3);

    expect(detailText()).toContain('Sin materias asignadas');
  });

  it('should show the empty groups message for a newly registered profesor', () => {
    registerDemo04();
    openDetail(3);

    expect(detailText()).toContain('Sin grupos asignados');
  });

  it('should close without modifying profesores data', () => {
    const profesoresBeforeConsultation = service.profesores();
    openDetail();

    click('.detail-modal__actions button');

    expect(service.profesores()).toBe(profesoresBeforeConsultation);
    expect(compiled().querySelector('.detail-modal')).toBeNull();
  });

  it('should close the detail modal with Escape', () => {
    openDetail();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(compiled().querySelector('.detail-modal')).toBeNull();
  });

  it('should consult a profesor registered during the current session', () => {
    registerDemo04();

    openDetail(3);

    expect(detailText()).toContain('Docente Demo 04');
    expect(detailText()).toContain('DOC-DEMO-004');
    expect(detailText()).toContain('Activo');
    expect(detailText()).toContain('Sin materias asignadas');
    expect(detailText()).toContain('Sin grupos asignados');
  });

  it('should change the displayed profesor when consulting different rows', () => {
    openDetail();
    expect(detailText()).toContain('Docente Demo 01');
    click('.detail-modal__close');

    openDetail(1);

    expect(detailText()).toContain('Docente Demo 02');
    expect(detailText()).not.toContain('Docente Demo 01');
  });

  it('should safely ignore a consultation for an unknown id', () => {
    const table = fixture.debugElement.query(By.directive(ProfesoresTable))
      .componentInstance as ProfesoresTable;

    expect(() => table.consultar.emit(999)).not.toThrow();
    fixture.detectChanges();

    expect(compiled().querySelector('.detail-modal')).toBeNull();
  });

  it('should return focus to the consultation button after closing', () => {
    const firstButton = compiled().querySelector<HTMLButtonElement>('.actions__view');
    openDetail();

    click('.detail-modal__close');

    expect(document.activeElement).toBe(firstButton);
  });

  it('should open the edit modal from an accessible edit button', () => {
    const firstButton = compiled().querySelector<HTMLButtonElement>('.actions__edit');
    expect(firstButton?.getAttribute('aria-label')).toBe('Editar profesor Docente Demo 01');

    openEdit();

    expect(compiled().querySelector('.edit-modal[role="dialog"]')).not.toBeNull();
    expect(compiled().querySelector('#edit-modal-title')?.textContent).toContain(
      'Modificar profesor',
    );
  });

  it('should preload the current profesor name', () => {
    openEdit();

    expect(compiled().querySelector<HTMLInputElement>('#editar-profesor-nombre')?.value).toBe(
      'Docente Demo 01',
    );
  });

  it('should preload the current profesor cedula', () => {
    openEdit();

    expect(compiled().querySelector<HTMLInputElement>('#editar-profesor-cedula')?.value).toBe(
      'DOC-DEMO-001',
    );
  });

  it('should cancel editing without modifying data', () => {
    const profesorBeforeEdit = service.getProfesorById(1);
    openEdit();
    write('#editar-profesor-nombre', 'Cambio cancelado');
    write('#editar-profesor-cedula', 'DOC-CANCELADO');

    click('.edit-modal__cancel');

    expect(service.getProfesorById(1)).toBe(profesorBeforeEdit);
    expect(compiled().querySelector('.edit-modal')).toBeNull();
  });

  it('should close with Escape without modifying data', () => {
    const profesorBeforeEdit = service.getProfesorById(1);
    openEdit();
    write('#editar-profesor-nombre', 'Cambio descartado');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(service.getProfesorById(1)).toBe(profesorBeforeEdit);
    expect(compiled().querySelector('.edit-modal')).toBeNull();
  });

  it('should show the required name error while editing', () => {
    openEdit();
    write('#editar-profesor-nombre', '   ');

    saveEdit();

    expect(compiled().querySelector('.edit-modal')?.textContent).toContain(
      'El nombre es obligatorio.',
    );
  });

  it('should show the required cedula error while editing', () => {
    openEdit();
    write('#editar-profesor-cedula', '   ');

    saveEdit();

    expect(compiled().querySelector('.edit-modal')?.textContent).toContain(
      'La cédula es obligatoria.',
    );
  });

  it('should reject a cedula that belongs to another profesor', () => {
    const profesorBeforeEdit = service.getProfesorById(1);
    openEdit();
    write('#editar-profesor-cedula', '  doc-demo-002  ');

    saveEdit();

    expect(compiled().querySelector('.edit-modal')?.textContent).toContain(
      'Ya existe un profesor con esta cédula.',
    );
    expect(service.getProfesorById(1)).toBe(profesorBeforeEdit);
  });

  it('should update the table row after saving valid changes', () => {
    openEdit();
    write('#editar-profesor-nombre', '  Docente Demo 01 Actualizado  ');
    write('#editar-profesor-cedula', '  DOC-DEMO-001-A  ');

    saveEdit();

    const firstRowText = compiled().querySelector('tbody tr')?.textContent;
    expect(firstRowText).toContain('Docente Demo 01 Actualizado');
    expect(firstRowText).toContain('DOC-DEMO-001-A');
    expect(compiled().querySelector('.edit-modal')).toBeNull();
  });

  it('should show updated data in a later detail consultation', () => {
    openEdit();
    write('#editar-profesor-nombre', 'Docente Demo 01 Actualizado');
    write('#editar-profesor-cedula', 'DOC-DEMO-001-A');
    saveEdit();

    openDetail();

    expect(detailText()).toContain('Docente Demo 01 Actualizado');
    expect(detailText()).toContain('DOC-DEMO-001-A');
  });

  it('should edit a profesor registered during the current session', () => {
    registerDemo04();
    openEdit(3);
    write('#editar-profesor-nombre', 'Docente Demo 04 Modificado');
    write('#editar-profesor-cedula', 'DOC-DEMO-004-A');

    saveEdit();

    const fourthRowText = compiled().querySelectorAll('tbody tr').item(3).textContent;
    expect(fourthRowText).toContain('Docente Demo 04 Modificado');
    expect(fourthRowText).toContain('DOC-DEMO-004-A');
  });

  it('should keep the total profesores count unchanged after editing', () => {
    const initialLength = service.profesores().length;
    openEdit();
    write('#editar-profesor-nombre', 'Docente Demo 01 Actualizado');

    saveEdit();

    expect(service.profesores()).toHaveLength(initialLength);
    expect(compiled().querySelector('.registry__count')?.textContent).toContain('3 profesores');
  });

  it('should not modify a different row', () => {
    const secondProfesorBeforeEdit = service.getProfesorById(2);
    openEdit();
    write('#editar-profesor-nombre', 'Docente Demo 01 Actualizado');

    saveEdit();

    expect(service.getProfesorById(2)).toBe(secondProfesorBeforeEdit);
  });

  it('should allow saving without changing the current cedula', () => {
    const initialLength = service.profesores().length;
    openEdit();

    saveEdit();

    expect(compiled().querySelector('.edit-modal')).toBeNull();
    expect(service.profesores()).toHaveLength(initialLength);
    expect(service.getProfesorById(1)?.cedula).toBe('DOC-DEMO-001');
  });

  it('should safely ignore editing an unknown id', () => {
    const table = fixture.debugElement.query(By.directive(ProfesoresTable))
      .componentInstance as ProfesoresTable;

    expect(() => table.editar.emit(999)).not.toThrow();
    fixture.detectChanges();

    expect(compiled().querySelector('.edit-modal')).toBeNull();
  });

  it('should return focus to the edit button after closing', () => {
    const firstButton = compiled().querySelector<HTMLButtonElement>('.actions__edit');
    openEdit();

    click('.edit-modal__close');

    expect(document.activeElement).toBe(firstButton);
  });

  it('should open the deactivation modal from an accessible active profesor button', () => {
    const firstButton = compiled().querySelector<HTMLButtonElement>('.actions__danger');
    expect(firstButton?.getAttribute('aria-label')).toBe('Dar de baja a Docente Demo 01');
    expect(firstButton?.getAttribute('aria-disabled')).toBe('false');

    openDeactivation();

    expect(compiled().querySelector('.deactivate-modal[role="dialog"]')).not.toBeNull();
    expect(compiled().querySelector('#deactivate-modal-title')?.textContent).toContain(
      'Dar de baja profesor',
    );
  });

  it('should show the selected profesor in the deactivation confirmation', () => {
    openDeactivation(1);

    expect(compiled().querySelector('.deactivate-modal')?.textContent).toContain('Docente Demo 02');
    expect(compiled().querySelector('.deactivate-modal')?.textContent).not.toContain(
      'Docente Demo 01',
    );
  });

  it('should cancel deactivation without changing status', () => {
    openDeactivation();

    click('.deactivate-modal__cancel');

    expect(service.getProfesorById(1)?.estado).toBe('Activo');
    expect(compiled().querySelector('.deactivate-modal')).toBeNull();
  });

  it('should close deactivation with X without changing status', () => {
    openDeactivation();

    click('.deactivate-modal__close');

    expect(service.getProfesorById(1)?.estado).toBe('Activo');
    expect(compiled().querySelector('.deactivate-modal')).toBeNull();
  });

  it('should close deactivation with Escape without changing status', () => {
    openDeactivation();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(service.getProfesorById(1)?.estado).toBe('Activo');
    expect(compiled().querySelector('.deactivate-modal')).toBeNull();
  });

  it('should change an active profesor status to Inactivo after confirmation', () => {
    openDeactivation();

    confirmDeactivation();

    expect(service.getProfesorById(1)?.estado).toBe('Inactivo');
    expect(compiled().querySelector('tbody tr .status')?.textContent).toContain('Inactivo');
  });

  it('should keep the deactivated profesor visible in the table', () => {
    const initialRows = compiled().querySelectorAll('tbody tr').length;
    openDeactivation();

    confirmDeactivation();

    expect(compiled().querySelectorAll('tbody tr')).toHaveLength(initialRows);
    expect(compiled().querySelector('tbody tr')?.textContent).toContain('Docente Demo 01');
  });

  it('should keep total profesores counters unchanged after deactivation', () => {
    const initialLength = service.profesores().length;
    openDeactivation();

    confirmDeactivation();

    expect(service.profesores()).toHaveLength(initialLength);
    expect(compiled().querySelector('.registry__count')?.textContent).toContain('3 profesores');
    expect(compiled().querySelector('.summary-card strong')?.textContent).toContain('3');
  });

  it('should show Inactivo in a later detail consultation', () => {
    openDeactivation();
    confirmDeactivation();

    openDetail();

    expect(compiled().querySelector('.detail-modal .status')?.textContent).toContain('Inactivo');
  });

  it('should preserve all other profesor data after deactivation', () => {
    const profesorBeforeDeactivation = service.getProfesorById(1);
    openDeactivation();

    confirmDeactivation();

    expect(service.getProfesorById(1)).toEqual({
      ...profesorBeforeDeactivation,
      estado: 'Inactivo',
    });
  });

  it('should make deactivation unavailable for an inactive profesor', () => {
    openDeactivation();
    confirmDeactivation();

    const firstButton = compiled().querySelector<HTMLButtonElement>('.actions__danger');
    expect(firstButton?.getAttribute('aria-disabled')).toBe('true');
    expect(firstButton?.getAttribute('aria-label')).toBe('Docente Demo 01 ya está inactivo');

    firstButton?.click();
    fixture.detectChanges();
    expect(compiled().querySelector('.deactivate-modal')).toBeNull();
  });

  it('should deactivate a profesor registered during the current session', () => {
    registerDemo04();
    openDeactivation(3);

    confirmDeactivation();

    expect(service.getProfesorById(4)?.estado).toBe('Inactivo');
    expect(compiled().querySelectorAll('tbody tr')).toHaveLength(4);
    expect(compiled().querySelectorAll('tbody tr').item(3).textContent).toContain('Inactivo');
  });

  it('should not modify another row when deactivating a profesor', () => {
    const secondProfesorBeforeDeactivation = service.getProfesorById(2);
    openDeactivation();

    confirmDeactivation();

    expect(service.getProfesorById(2)).toBe(secondProfesorBeforeDeactivation);
  });

  it('should safely ignore deactivation for an unknown id', () => {
    const table = fixture.debugElement.query(By.directive(ProfesoresTable))
      .componentInstance as ProfesoresTable;

    expect(() => table.darDeBaja.emit(999)).not.toThrow();
    fixture.detectChanges();

    expect(compiled().querySelector('.deactivate-modal')).toBeNull();
  });

  it('should return focus to the deactivation button after closing', () => {
    const firstButton = compiled().querySelector<HTMLButtonElement>('.actions__danger');
    openDeactivation();

    click('.deactivate-modal__cancel');

    expect(document.activeElement).toBe(firstButton);
  });
});
