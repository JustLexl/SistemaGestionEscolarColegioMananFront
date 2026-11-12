import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Profesor } from '../../models/profesor.model';
import { ProfesoresMockService } from '../../services/profesores-mock.service';
import {
  RolesApiError,
  RolesApiService,
} from '../../../../pages/roles/roles-api.service';

@Component({
  selector: 'app-profesor-deactivate-modal',
  templateUrl: './profesor-deactivate-modal.html',
  styleUrl: './profesor-deactivate-modal.scss',
})
export class ProfesorDeactivateModal implements AfterViewInit {
  private readonly profesoresService = inject(ProfesoresMockService);
  private readonly rolesApi = inject(RolesApiService);

  @ViewChild('cancelButton', { static: true })
  private readonly cancelButton!: ElementRef<HTMLButtonElement>;

  readonly profesor = input.required<Profesor>();
  readonly closed = output<void>();

  protected readonly guardando = signal(false);
  protected readonly errorApi = signal('');

  ngAfterViewInit(): void {
    this.cancelButton.nativeElement.focus();
  }

  protected async confirmarBaja(): Promise<void> {
    if (this.guardando()) {
      return;
    }

    const profesor = this.profesor();

    if (profesor.estado === 'Inactivo') {
      this.cerrar();
      return;
    }

    // Compatibilidad con profesores locales.
    if (profesor.usuarioId == null) {
      this.profesoresService.darDeBajaProfesor(profesor.id);
      this.cerrar();
      return;
    }

    this.guardando.set(true);
    this.errorApi.set('');

    try {
      const usuario = await this.rolesApi.obtenerRolPorId(
        profesor.usuarioId,
      );

      if (usuario.estado === 'Activo') {
        await this.rolesApi.cambiarEstado(usuario.id);
      }

      this.guardando.set(false);
      this.cerrar();
    } catch (error) {
      this.errorApi.set(
        error instanceof RolesApiError
          ? error.message
          : 'No fue posible dar de baja al profesor.',
      );
    } finally {
      this.guardando.set(false);
    }
  }

  protected cerrar(): void {
    if (this.guardando()) {
      return;
    }

    this.errorApi.set('');
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  protected cerrarConEscape(): void {
    this.cerrar();
  }
}
