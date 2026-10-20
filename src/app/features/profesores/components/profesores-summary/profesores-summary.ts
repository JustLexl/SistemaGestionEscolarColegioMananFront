import { Component, computed, input } from '@angular/core';
import { IconName, UiIcon } from '../../../../shared/ui-icon/ui-icon';

interface SummaryCard {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly icon: IconName;
  readonly tone: 'teal' | 'blue' | 'amber';
}

@Component({
  selector: 'app-profesores-summary',
  imports: [UiIcon],
  templateUrl: './profesores-summary.html',
  styleUrl: './profesores-summary.scss',
})
export class ProfesoresSummary {
  readonly profesoresCount = input.required<number>();

  protected readonly cards = computed<readonly SummaryCard[]>(() => [
    {
      label: 'Total Profesores',
      value: String(this.profesoresCount()),
      note: 'Valor demostrativo',
      icon: 'teachers',
      tone: 'teal',
    },
    {
      label: 'Grupos Cubiertos',
      value: '18/20',
      note: 'Cobertura de muestra',
      icon: 'chart',
      tone: 'blue',
    },
    {
      label: 'Asistencia Promedio',
      value: '96%',
      note: 'Indicador de muestra',
      icon: 'check',
      tone: 'amber',
    },
  ]);
}
