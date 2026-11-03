import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
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
import { UiIcon } from '../../../../shared/ui-icon/ui-icon';
import {
  Calificacion,
  CalificacionDatos,
} from '../../models/calificacion.model';
import {
  AlumnoApi,
  CalificacionesApiError,
  CalificacionesApiService,
} from '../../services/calificaciones-api.service';

type ModalMode = 'create' | 'detail' | 'edit' | 'delete' | null;

function scoreValidator(
  control: AbstractControl<string | number>,
): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return /^(?:10(?:\.0)?|[0-9](?:\.\d)?)$/.test(value) ? null : { score: true };
}

@Component({
  selector: 'app-calificaciones-page',
  imports: [UiIcon, ReactiveFormsModule],
  templateUrl: './calificaciones-page.html',
  styleUrl: './calificaciones-page.scss',
})
export class CalificacionesPage implements OnInit {
  private readonly service = inject(CalificacionesApiService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly registerButton =
    viewChild<ElementRef<HTMLButtonElement>>('registerButton');
  private readonly firstModalControl =
    viewChild<ElementRef<HTMLElement>>('firstModalControl');
  private readonly collection = signal<readonly Calificacion[]>([]);
  private readonly materiasCatalog = signal<readonly string[]>([]);

  protected readonly alumnos = signal<readonly AlumnoApi[]>([]);
  protected readonly periodos = [
    '1er Trimestre',
    '2° Trimestre',
    '3er Trimestre',
  ];
  protected readonly calificaciones = this.collection.asReadonly();
  protected readonly grados = computed(() =>
    this.unique([
      ...this.collection().map((item) => item.grado),
      ...this.alumnos().map((item) => this.shortGrade(item.grado)),
    ]),
  );
  protected readonly grupos = computed(() =>
    this.unique([
      ...this.collection().map((item) => item.grupo),
      ...this.alumnos().map((item) => this.shortGroup(item.grupo)),
    ]),
  );
  protected readonly materias = computed(() => this.materiasCatalog());
  protected readonly total = computed(() => this.collection().length);
  protected readonly promedioGeneral = computed(() => {
    const items = this.collection();
    if (items.length === 0) return 0;
    return Number(
      (
        items.reduce((sum, item) => sum + item.calificacion, 0) / items.length
      ).toFixed(1),
    );
  });
  protected readonly materiasEvaluadas = computed(
    () => new Set(this.collection().map((item) => item.materia)).size,
  );
  protected readonly search = signal('');
  protected readonly gradoFilter = signal('');
  protected readonly grupoFilter = signal('');
  protected readonly materiaFilter = signal('');
  protected readonly periodoFilter = signal('');
  protected readonly modalMode = signal<ModalMode>(null);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly duplicateError = signal(false);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly saving = signal(false);
  protected readonly operationError = signal('');

  protected readonly selected = computed(() => {
    const id = this.selectedId();
    return id ? this.collection().find((item) => item.id === id) : undefined;
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
    alumno: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    matricula: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    grado: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    grupo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    materia: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    periodo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    calificacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, scoreValidator],
    }),
  });

  ngOnInit(): void {
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');

    try {
      const [calificaciones, alumnos, materias] = await Promise.all([
        this.service.obtenerCalificaciones(),
        this.service.obtenerAlumnos(),
        this.service.obtenerMaterias(),
      ]);
      this.collection.set(calificaciones);
      this.alumnos.set(alumnos);
      this.materiasCatalog.set(
        this.unique(materias.map((item) => item.nombre)),
      );
    } catch (error) {
      this.loadError.set(this.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected openCreate(): void {
    this.selectedId.set(null);
    this.form.reset();
    this.openModal('create');
  }

  protected async openDetail(id: string): Promise<void> {
    if (!this.collection().some((item) => item.id === id)) return;
    this.selectedId.set(id);
    this.openModal('detail');

    try {
      const detail = await this.service.obtenerCalificacion(id);
      this.collection.update((items) =>
        items.map((item) => (item.id === detail.id ? detail : item)),
      );
    } catch (error) {
      this.operationError.set(this.errorMessage(error));
    }
  }

  protected openEdit(id: string): void {
    const item = this.collection().find(
      (calificacion) => calificacion.id === id,
    );
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
    if (!this.collection().some((item) => item.id === id)) return;
    this.selectedId.set(id);
    this.openModal('delete');
  }

  protected selectAlumno(matricula: string): void {
    const alumno = this.alumnos().find((item) => item.matricula === matricula);
    this.form.patchValue({
      alumno: alumno?.nombre ?? '',
      matricula: alumno?.matricula ?? '',
      grado: alumno ? this.shortGrade(alumno.grado) : '',
      grupo: alumno ? this.shortGroup(alumno.grupo) : '',
    });
    this.clearDuplicateError();
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    this.duplicateError.set(false);
    this.operationError.set('');
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

    this.saving.set(true);
    try {
      if (this.modalMode() === 'create') {
        const created = await this.service.registrarCalificacion(datos);
        this.collection.update((items) => [...items, created]);
      } else {
        const id = this.selectedId();
        if (id) {
          const updated = await this.service.actualizarCalificacion(id, datos);
          this.collection.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        }
      }
      this.closeModal();
    } catch (error) {
      if (error instanceof CalificacionesApiError && error.status === 409) {
        this.duplicateError.set(true);
        return;
      }
      this.operationError.set(this.errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async confirmDelete(): Promise<void> {
    const id = this.selectedId();
    if (!id) return;

    this.operationError.set('');
    this.saving.set(true);
    try {
      await this.service.eliminarCalificacion(id);
      this.collection.update((items) => items.filter((item) => item.id !== id));
      this.closeModal();
    } catch (error) {
      this.operationError.set(this.errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected closeModal(): void {
    const mode = this.modalMode();
    const id = this.selectedId();
    this.modalMode.set(null);
    this.selectedId.set(null);
    this.submitted.set(false);
    this.duplicateError.set(false);
    this.operationError.set('');
    queueMicrotask(() => {
      if (mode === 'create') {
        this.registerButton()?.nativeElement.focus();
        return;
      }
      const action =
        mode === 'detail' ? 'view' : mode === 'edit' ? 'edit' : 'delete';
      this.host.nativeElement
        .querySelector<HTMLButtonElement>(
          `[data-action="${action}"][data-id="${id}"]`,
        )
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

  protected getCalificacionTone(
    value: number,
  ): 'score--high' | 'score--medium' | 'score--low' {
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
    this.operationError.set('');
  }

  @HostListener('document:keydown.escape')
  protected closeWithEscape(): void {
    if (this.modalMode()) this.closeModal();
  }

  private openModal(mode: Exclude<ModalMode, null>): void {
    this.submitted.set(false);
    this.duplicateError.set(false);
    this.operationError.set('');
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

  private shortGrade(value: string): string {
    return value.replace(/\s+Primaria$/i, '').trim();
  }

  private shortGroup(value: string): string {
    return value.replace(/^Grupo\s+/i, '').trim();
  }

  private unique(values: readonly string[]): readonly string[] {
    return [...new Set(values.filter(Boolean))];
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'Ocurrió un error inesperado.';
  }
}
