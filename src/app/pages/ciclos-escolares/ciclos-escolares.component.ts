import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CicloEscolar,
  CicloEscolarPayload,
  CiclosEscolaresApiError,
  CiclosEscolaresApiService,
  EstadoCiclo,
} from './ciclos-escolares-api.service';

@Component({
  selector: 'app-ciclos-escolares',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ciclos-escolares.component.html',
  styleUrl: './ciclos-escolares.component.css',
})
export class CiclosEscolaresComponent implements OnInit {
  private readonly api = inject(CiclosEscolaresApiService);

  protected readonly ciclos = signal<readonly CicloEscolar[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');
  protected readonly modalAbierto = signal(false);
  protected readonly cicloEditandoId = signal<number | null>(null);
  protected readonly filtroEstado = signal<EstadoCiclo | ''>('');

  protected readonly ciclosFiltrados = computed(() =>
    this.ciclos().filter((ciclo) => !this.filtroEstado() || ciclo.estado === this.filtroEstado()),
  );
  protected readonly activos = computed(() =>
    this.ciclos().filter((ciclo) => ciclo.estado === 'Activo').length,
  );
  protected readonly planeados = computed(() =>
    this.ciclos().filter((ciclo) => ciclo.estado === 'Planeacion').length,
  );

  protected readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fechaFin: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    void this.cargarCiclos();
  }

  protected async cargarCiclos(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.ciclos.set(await this.api.obtenerCiclos());
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirCrear(): void {
    this.cicloEditandoId.set(null);
    this.form.reset({ nombre: '', fechaInicio: '', fechaFin: '' });
    this.error.set('');
    this.modalAbierto.set(true);
  }

  protected abrirEditar(ciclo: CicloEscolar): void {
    if (ciclo.estado !== 'Planeacion') return;
    this.cicloEditandoId.set(ciclo.id);
    this.form.setValue({
      nombre: ciclo.nombre,
      fechaInicio: ciclo.fechaInicio,
      fechaFin: ciclo.fechaFin,
    });
    this.error.set('');
    this.modalAbierto.set(true);
  }

  protected cerrar(): void {
    if (!this.guardando()) this.modalAbierto.set(false);
  }

  protected async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: CicloEscolarPayload = this.form.getRawValue();
    if (payload.fechaInicio >= payload.fechaFin) {
      this.error.set('La fecha de inicio debe ser anterior a la fecha de fin.');
      return;
    }

    this.guardando.set(true);
    this.error.set('');
    try {
      const id = this.cicloEditandoId();
      if (id === null) {
        await this.api.crearCiclo(payload);
        this.mensaje.set('Ciclo escolar creado correctamente.');
      } else {
        await this.api.actualizarCiclo(id, payload);
        this.mensaje.set('Ciclo escolar actualizado correctamente.');
      }
      this.modalAbierto.set(false);
      await this.cargarCiclos();
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected fechaLegible(fecha: string): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(`${fecha}T00:00:00Z`));
  }

  protected etiquetaEstado(estado: EstadoCiclo): string {
    return estado === 'Planeacion' ? 'Planeación' : estado;
  }

  private mensajeError(error: unknown): string {
    if (error instanceof CiclosEscolaresApiError) return error.message;
    return 'No fue posible completar la operación. Intenta nuevamente.';
  }
}
