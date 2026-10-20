import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Header } from '../../../../layout/header/header';
import { UiIcon } from '../../../../shared/ui-icon/ui-icon';
import { Calificacion, CalificacionDatos } from '../../models/calificacion.model';
import {
  CalificacionDuplicadaError,
  CalificacionesMockService,
} from '../../services/calificaciones-mock.service';

type ModalMode = 'create' | 'detail' | 'edit' | 'delete' | null;

function scoreValidator(control: AbstractControl<string | number>): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return /^(?:10(?:\.0)?|[0-9](?:\.\d)?)$/.test(value) ? null : { score: true };
}

@Component({
  selector: 'app-calificaciones-page',
  imports: [Header, UiIcon, ReactiveFormsModule],
  templateUrl: './calificaciones-page.html',
  styleUrl: './calificaciones-page.scss',
})
export class CalificacionesPage {
  private readonly service = inject(CalificacionesMockService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly registerButton = viewChild<ElementRef<HTMLButtonElement>>('registerButton');
  private readonly firstModalControl = viewChild<ElementRef<HTMLElement>>('firstModalControl');

  protected readonly grados = ['1°', '2°', '3°', '4°', '5°', '6°'];
  protected readonly grupos = ['A', 'B'];
  protected readonly materias = ['Matemáticas', 'Lengua', 'Historia', 'Ciencias'];
  protected readonly periodos = ['1er Trimestre', '2° Trimestre', '3er Trimestre'];
  protected readonly calificaciones = this.service.calificaciones;
  protected readonly total = this.service.total;
  protected readonly promedioGeneral = this.service.promedioGeneral;
  protected readonly materiasEvaluadas = this.service.materiasEvaluadas;
  protected readonly search = signal('');
  protected readonly gradoFilter = signal('');
  protected readonly grupoFilter = signal('');
  protected readonly materiaFilter = signal('');
  protected readonly periodoFilter = signal('');
  protected readonly modalMode = signal<ModalMode>(null);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly duplicateError = signal(false);

  protected readonly selected = computed(() => {
    const id = this.selectedId();
    return id ? this.service.getCalificacionById(id) : undefined;
  });

  protected readonly filtered = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('es-MX');
    return this.calificaciones().filter((item) => {
      const matchesSearch =
        !query ||
        item.alumno.toLocaleLowerCase('es-MX').includes(query) ||
        item.matricula.toLocaleLowerCase('es-MX').includes(query);
      return (
        matchesSearch &&
        (!this.gradoFilter() || item.grado === this.gradoFilter()) &&
        (!this.grupoFilter() || item.grupo === this.grupoFilter()) &&
        (!this.materiaFilter() || item.materia === this.materiaFilter()) &&
        (!this.periodoFilter() || item.periodo === this.periodoFilter())
      );
    });
  });

  protected readonly form = new FormGroup({
    alumno: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    matricula: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    grado: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    grupo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    materia: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    periodo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    calificacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, scoreValidator],
    }),
  });

  protected openCreate(): void {
    this.selectedId.set(null);
    this.form.reset();
    this.openModal('create');
  }

  protected openDetail(id: string): void {
    if (!this.service.getCalificacionById(id)) return;
    this.selectedId.set(id);
    this.openModal('detail');
  }

  protected openEdit(id: string): void {
    const item = this.service.getCalificacionById(id);
    if (!item) return;
    this.selectedId.set(id);
    this.form.reset({
      alumno: item.alumno,
      matricula: item.matricula,
      grado: item.grado,
      grupo: item.grupo,
      materia: item.materia,
      periodo: item.periodo,
      calificacion: String(item.calificacion),
    });
    this.openModal('edit');
  }

  protected openDelete(id: string): void {
    if (!this.service.getCalificacionById(id)) return;
    this.selectedId.set(id);
    this.openModal('delete');
  }

  protected save(): void {
    this.submitted.set(true);
    this.duplicateError.set(false);
    this.trimTextControls();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const datos: CalificacionDatos = {
      alumno: values.alumno,
      matricula: values.matricula,
      grado: values.grado,
      grupo: values.grupo,
      materia: values.materia,
      periodo: values.periodo,
      calificacion: Number(values.calificacion),
    };

    try {
      if (this.modalMode() === 'create') {
        this.service.registrarCalificacion(datos);
      } else {
        const id = this.selectedId();
        if (id) this.service.actualizarCalificacion(id, datos);
      }
      this.closeModal();
    } catch (error) {
      if (error instanceof CalificacionDuplicadaError) {
        this.duplicateError.set(true);
        return;
      }
      throw error;
    }
  }

  protected confirmDelete(): void {
    const id = this.selectedId();
    if (id) this.service.eliminarCalificacion(id);
    this.closeModal();
  }

  protected closeModal(): void {
    const mode = this.modalMode();
    const id = this.selectedId();
    this.modalMode.set(null);
    this.selectedId.set(null);
    this.submitted.set(false);
    this.duplicateError.set(false);
    queueMicrotask(() => {
      if (mode === 'create') {
        this.registerButton()?.nativeElement.focus();
        return;
      }
      const action = mode === 'detail' ? 'view' : mode === 'edit' ? 'edit' : 'delete';
      this.host.nativeElement
        .querySelector<HTMLButtonElement>(`[data-action="${action}"][data-id="${id}"]`)
        ?.focus();
    });
  }

  protected clearFilters(): void {
    this.search.set('');
    this.gradoFilter.set('');
    this.grupoFilter.set('');
    this.materiaFilter.set('');
    this.periodoFilter.set('');
  }

  protected fieldInvalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected scoreError(): string {
    const control = this.form.controls.calificacion;
    return control.hasError('required')
      ? 'La calificación es obligatoria.'
      : 'Ingresa un valor de 0 a 10 con máximo un decimal.';
  }

  protected formatScore(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  protected getCalificacionTone(value: number): 'score--high' | 'score--medium' | 'score--low' {
    if (value >= 8) return 'score--high';
    if (value >= 6.5) return 'score--medium';
    return 'score--low';
  }

  protected rangeLabel(): string {
    const count = this.filtered().length;
    return count === 0 ? '0' : `1–${count}`;
  }

  protected clearDuplicateError(): void {
    this.duplicateError.set(false);
  }

  @HostListener('document:keydown.escape')
  protected closeWithEscape(): void {
    if (this.modalMode()) this.closeModal();
  }

  private openModal(mode: Exclude<ModalMode, null>): void {
    this.submitted.set(false);
    this.duplicateError.set(false);
    this.modalMode.set(mode);
    setTimeout(() => this.firstModalControl()?.nativeElement.focus());
  }

  private trimTextControls(): void {
    const names: readonly (keyof typeof this.form.controls)[] = [
      'alumno',
      'matricula',
      'grado',
      'grupo',
      'materia',
      'periodo',
    ];
    for (const name of names) {
      const control = this.form.controls[name];
      control.setValue(control.value.trim());
    }
  }
}
