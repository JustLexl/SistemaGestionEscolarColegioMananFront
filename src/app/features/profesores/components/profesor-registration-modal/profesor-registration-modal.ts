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
  RolesApiError,
  RolesApiService,
} from '../../../../pages/roles/roles-api.service';

@Component({
  selector: 'app-profesor-registration-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './profesor-registration-modal.html',
  styleUrl: './profesor-registration-modal.scss',
})
export class ProfesorRegistrationModal implements AfterViewInit {
  private readonly rolesApi = inject(RolesApiService);

  @ViewChild('nombreInput', { static: true })
  private readonly nombreInput!: ElementRef<HTMLInputElement>;

  readonly closed = output<void>();
  protected readonly submitted = signal(false);
  protected readonly cedulaDuplicada = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorServidor = signal('');

  protected readonly form = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    cedula: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngAfterViewInit(): void {
    this.nombreInput.nativeElement.focus();
  }

  protected async guardar(): Promise<void> {
    if (this.guardando()) return;

    this.submitted.set(true);
    this.cedulaDuplicada.set(false);
    this.errorServidor.set('');

    const nombre = this.form.controls.nombre.value.trim();
    const correo = this.form.controls.correo.value.trim();
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

    this.guardando.set(true);

    try {
      await this.rolesApi.registrarRol({
        nombre,
        correo,
        cedula,
        puesto: 'Profesores',
        estado: 'Activo',
      });

      this.guardando.set(false);
      this.cerrar();
    } catch (error) {
      if (error instanceof RolesApiError) {
        if (
          error.status === 409 &&
          error.message.toLowerCase().includes('cédula')
        ) {
          this.cedulaDuplicada.set(true);
          this.form.controls.cedula.setErrors({ duplicada: true });
          return;
        }

        this.errorServidor.set(error.message);
        return;
      }

      this.errorServidor.set(
        'Ocurrió un error inesperado al registrar al profesor.',
      );
    } finally {
      this.guardando.set(false);
    }
  }

  protected cerrar(): void {
    if (this.guardando()) return;

    this.form.reset();
    this.submitted.set(false);
    this.cedulaDuplicada.set(false);
    this.errorServidor.set('');
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

  protected mostrarErrorCorreo(): boolean {
    const control = this.form.controls.correo;
    return control.invalid && (control.touched || this.submitted());
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
