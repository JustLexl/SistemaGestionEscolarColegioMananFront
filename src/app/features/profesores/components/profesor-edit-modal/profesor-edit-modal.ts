import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profesor } from '../../models/profesor.model';
import {
  CedulaProfesorDuplicadaError,
  ProfesoresMockService,
} from '../../services/profesores-mock.service';
import {
  RolesApiError,
  RolesApiService,
} from '../../../../pages/roles/roles-api.service';

@Component({
  selector: 'app-profesor-edit-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './profesor-edit-modal.html',
  styleUrl: './profesor-edit-modal.scss',
})
export class ProfesorEditModal implements OnInit, AfterViewInit {
  private readonly profesoresService = inject(ProfesoresMockService);
  private readonly rolesApi = inject(RolesApiService);

  @ViewChild('nombreInput', { static: true })
  private readonly nombreInput!: ElementRef<HTMLInputElement>;

  readonly profesor = input.required<Profesor>();
  readonly closed = output<void>();

  protected readonly submitted = signal(false);
  protected readonly cedulaDuplicada = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorApi = signal('');

  protected readonly form = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    cedula: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    const profesor = this.profesor();

    this.form.setValue({
      nombre: profesor.nombre,
      cedula: profesor.cedula,
    });
  }

  ngAfterViewInit(): void {
    this.nombreInput.nativeElement.focus();
    this.nombreInput.nativeElement.select();
  }

  protected async guardar(): Promise<void> {
    if (this.guardando()) {
      return;
    }

    this.submitted.set(true);
    this.cedulaDuplicada.set(false);
    this.errorApi.set('');

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

    const profesor = this.profesor();

    // Compatibilidad con profesores locales sin usuario relacionado.
    if (profesor.usuarioId == null) {
      try {
        const actualizado = this.profesoresService.actualizarProfesor(
          profesor.id,
          { nombre, cedula },
        );

        if (actualizado) {
          this.cerrar();
        }
      } catch (error) {
        if (error instanceof CedulaProfesorDuplicadaError) {
          this.cedulaDuplicada.set(true);
          this.form.controls.cedula.setErrors({ duplicada: true });
          return;
        }

        throw error;
      }

      return;
    }

    this.guardando.set(true);

    try {
      const usuario = await this.rolesApi.obtenerRolPorId(
        profesor.usuarioId,
      );

      await this.rolesApi.actualizarRol(usuario.id, {
        nombre,
        cedula,
        correo: usuario.correo,
        puesto: usuario.puesto,
        estado: usuario.estado,
      });

      this.guardando.set(false);
      this.cerrar();
    } catch (error) {
      if (error instanceof RolesApiError) {
        if (
          error.status === 409 ||
          /c[eé]dula.*(duplicad|registrad|existe|uso)/i.test(error.message)
        ) {
          this.cedulaDuplicada.set(true);
          this.form.controls.cedula.setErrors({ duplicada: true });
        } else {
          this.errorApi.set(error.message);
        }
      } else {
        this.errorApi.set('No fue posible actualizar al profesor.');
      }
    } finally {
      this.guardando.set(false);
    }
  }

  protected cerrar(): void {
    if (this.guardando()) {
      return;
    }

    this.submitted.set(false);
    this.cedulaDuplicada.set(false);
    this.errorApi.set('');
    this.closed.emit();
  }

  protected limpiarErrorCedulaDuplicada(): void {
    if (this.cedulaDuplicada()) {
      this.cedulaDuplicada.set(false);
      this.form.controls.cedula.updateValueAndValidity({
        emitEvent: false,
      });
    }
  }

  protected mostrarErrorNombre(): boolean {
    const control = this.form.controls.nombre;

    return control.hasError('required') &&
      (control.touched || this.submitted());
  }

  protected mostrarErrorCedula(): boolean {
    const control = this.form.controls.cedula;

    return control.hasError('required') &&
      (control.touched || this.submitted());
  }

  @HostListener('document:keydown.escape')
  protected cerrarConEscape(): void {
    this.cerrar();
  }
}
