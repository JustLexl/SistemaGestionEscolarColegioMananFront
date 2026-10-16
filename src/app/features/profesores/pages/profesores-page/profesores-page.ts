import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Header } from '../../../../layout/header/header';
import { Sidebar } from '../../../../layout/sidebar/sidebar';
import { UiIcon } from '../../../../shared/ui-icon/ui-icon';
import { ProfesorDeactivateModal } from '../../components/profesor-deactivate-modal/profesor-deactivate-modal';
import { ProfesorDetailModal } from '../../components/profesor-detail-modal/profesor-detail-modal';
import { ProfesorEditModal } from '../../components/profesor-edit-modal/profesor-edit-modal';
import { ProfesorRegistrationModal } from '../../components/profesor-registration-modal/profesor-registration-modal';
import { ProfesoresFilters } from '../../components/profesores-filters/profesores-filters';
import { ProfesoresSummary } from '../../components/profesores-summary/profesores-summary';
import { ProfesoresTable } from '../../components/profesores-table/profesores-table';
import { Profesor } from '../../models/profesor.model';
import { ProfesoresMockService } from '../../services/profesores-mock.service';

@Component({
  selector: 'app-profesores-page',
  imports: [
    Header,
    Sidebar,
    UiIcon,
    ProfesorDeactivateModal,
    ProfesorDetailModal,
    ProfesorEditModal,
    ProfesorRegistrationModal,
    ProfesoresFilters,
    ProfesoresSummary,
    ProfesoresTable,
  ],
  templateUrl: './profesores-page.html',
  styleUrl: './profesores-page.scss',
})
export class ProfesoresPage {
  private readonly profesoresService = inject(ProfesoresMockService);
  private readonly registerButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('registerButton');
  private readonly profesoresTable = viewChild.required(ProfesoresTable);
  private readonly profesorConsultadoId = signal<Profesor['id'] | null>(null);
  private readonly profesorEditadoId = signal<Profesor['id'] | null>(null);
  private readonly profesorBajaId = signal<Profesor['id'] | null>(null);

  protected readonly profesores = this.profesoresService.profesores;
  protected readonly registroAbierto = signal(false);
  protected readonly profesorConsultado = computed(() => {
    const id = this.profesorConsultadoId();
    return id === null ? undefined : this.profesoresService.getProfesorById(id);
  });
  protected readonly profesorEditado = computed(() => {
    const id = this.profesorEditadoId();
    return id === null ? undefined : this.profesoresService.getProfesorById(id);
  });
  protected readonly profesorBaja = computed(() => {
    const id = this.profesorBajaId();
    return id === null ? undefined : this.profesoresService.getProfesorById(id);
  });

  protected cerrarRegistro(): void {
    this.registroAbierto.set(false);
    this.registerButton().nativeElement.focus();
  }

  protected abrirConsulta(id: Profesor['id']): void {
    if (!this.profesoresService.getProfesorById(id)) {
      this.profesorConsultadoId.set(null);
      return;
    }

    this.profesorConsultadoId.set(id);
  }

  protected cerrarConsulta(): void {
    const id = this.profesorConsultadoId();
    this.profesorConsultadoId.set(null);

    if (id !== null) {
      this.profesoresTable().focusConsultationButton(id);
    }
  }

  protected abrirEdicion(id: Profesor['id']): void {
    if (!this.profesoresService.getProfesorById(id)) {
      this.profesorEditadoId.set(null);
      return;
    }

    this.profesorEditadoId.set(id);
  }

  protected cerrarEdicion(): void {
    const id = this.profesorEditadoId();
    this.profesorEditadoId.set(null);

    if (id !== null) {
      this.profesoresTable().focusEditButton(id);
    }
  }

  protected abrirBaja(id: Profesor['id']): void {
    const profesor = this.profesoresService.getProfesorById(id);

    if (!profesor || profesor.estado === 'Inactivo') {
      this.profesorBajaId.set(null);
      return;
    }

    this.profesorBajaId.set(id);
  }

  protected cerrarBaja(): void {
    const id = this.profesorBajaId();
    this.profesorBajaId.set(null);

    if (id !== null) {
      this.profesoresTable().focusDeactivationButton(id);
    }
  }
}
