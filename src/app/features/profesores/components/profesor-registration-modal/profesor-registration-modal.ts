import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CedulaProfesorDuplicadaError,
  ProfesoresMockService,
} from '../../services/profesores-mock.service';

@Component({
  selector: 'app-profesor-registration-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './profesor-registration-modal.html',
  styleUrl: './profesor-registration-modal.scss',
})
export class ProfesorRegistrationModal implements AfterViewInit {
  private readonly profesoresService = inject(ProfesoresMockService);

  @ViewChild('nombreInput', { static: true })
  private readonly nombreInput!: ElementRef<HTMLInputElement>;

  readonly closed = output<void>();
  protected readonly submitted = signal(false);
  protected readonly cedulaDuplicada = signal(false);
  protected readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cedula: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngAfterViewInit(): void {
    this.nombreInput.nativeElement.focus();
  }

  protected guardar(): void {
    this.submitted.set(true);
    this.cedulaDuplicada.set(false);

    const nombre = this.form.controls.nombre.value.trim();
    const cedula = this.form.controls.cedula.value.trim();

    if (!nombre) {
      this.form.controls.nombre.setErrors({ required: true });
    }

    if (!cedula) {
      this.form.controls.cedula.setErrors({ required: true });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.profesoresService.registrarProfesor({ nombre, cedula });
      this.cerrar();
    } catch (error) {
      if (error instanceof CedulaProfesorDuplicadaError) {
        this.cedulaDuplicada.set(true);
        this.form.controls.cedula.setErrors({ duplicada: true });
        return;
      }

      throw error;
    }
  }

  protected cerrar(): void {
    this.form.reset();
    this.submitted.set(false);
    this.cedulaDuplicada.set(false);
    this.closed.emit();
  }

  protected limpiarErrorCedulaDuplicada(): void {
    if (this.cedulaDuplicada()) {
      this.cedulaDuplicada.set(false);
      this.form.controls.cedula.updateValueAndValidity({ emitEvent: false });
    }
  }

  protected mostrarErrorNombre(): boolean {
    const control = this.form.controls.nombre;
    return control.hasError('required') && (control.touched || this.submitted());
  }

  protected mostrarErrorCedula(): boolean {
    const control = this.form.controls.cedula;
    return control.hasError('required') && (control.touched || this.submitted());
  }

  @HostListener('document:keydown.escape')
  protected cerrarConEscape(): void {
    this.cerrar();
  }
}
