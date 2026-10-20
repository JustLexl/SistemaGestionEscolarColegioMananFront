import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  input,
  output,
} from '@angular/core';
import { Profesor } from '../../models/profesor.model';
import { ProfesoresMockService } from '../../services/profesores-mock.service';

@Component({
  selector: 'app-profesor-deactivate-modal',
  templateUrl: './profesor-deactivate-modal.html',
  styleUrl: './profesor-deactivate-modal.scss',
})
export class ProfesorDeactivateModal implements AfterViewInit {
  private readonly profesoresService = inject(ProfesoresMockService);

  @ViewChild('cancelButton', { static: true })
  private readonly cancelButton!: ElementRef<HTMLButtonElement>;

  readonly profesor = input.required<Profesor>();
  readonly closed = output<void>();

  ngAfterViewInit(): void {
    this.cancelButton.nativeElement.focus();
  }

  protected confirmarBaja(): void {
    this.profesoresService.darDeBajaProfesor(this.profesor().id);
    this.cerrar();
  }

  protected cerrar(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  protected cerrarConEscape(): void {
    this.cerrar();
  }
}
