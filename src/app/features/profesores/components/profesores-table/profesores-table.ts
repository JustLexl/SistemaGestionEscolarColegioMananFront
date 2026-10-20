import { Component, ElementRef, computed, input, output, viewChildren } from '@angular/core';
import { UiIcon } from '../../../../shared/ui-icon/ui-icon';
import { Profesor } from '../../models/profesor.model';

@Component({
  selector: 'app-profesores-table',
  imports: [UiIcon],
  templateUrl: './profesores-table.html',
  styleUrl: './profesores-table.scss',
})
export class ProfesoresTable {
  readonly profesores = input.required<readonly Profesor[]>();
  readonly consultar = output<Profesor['id']>();
  readonly editar = output<Profesor['id']>();
  readonly darDeBaja = output<Profesor['id']>();

  private readonly consultationButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('consultationButton');
  private readonly editButtons = viewChildren<ElementRef<HTMLButtonElement>>('editButton');
  private readonly deactivationButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('deactivationButton');

  protected readonly totalProfesores = computed(() => this.profesores().length);
  protected readonly rangoMostrado = computed(() => {
    const total = this.totalProfesores();
    return total === 0 ? '0' : `1–${total}`;
  });

  focusConsultationButton(id: Profesor['id']): void {
    const button = this.consultationButtons().find(
      ({ nativeElement }) => Number(nativeElement.dataset['profesorId']) === id,
    );

    button?.nativeElement.focus();
  }

  focusEditButton(id: Profesor['id']): void {
    const button = this.editButtons().find(
      ({ nativeElement }) => Number(nativeElement.dataset['profesorId']) === id,
    );

    button?.nativeElement.focus();
  }

  focusDeactivationButton(id: Profesor['id']): void {
    const button = this.deactivationButtons().find(
      ({ nativeElement }) => Number(nativeElement.dataset['profesorId']) === id,
    );

    button?.nativeElement.focus();
  }
}
