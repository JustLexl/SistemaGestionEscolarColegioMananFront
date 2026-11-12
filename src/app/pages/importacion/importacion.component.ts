import { Component, computed, inject, signal } from '@angular/core';
import {
  EntidadImportacion,
  ErrorImportacion,
  ImportacionApiError,
  ImportacionApiService,
  ResultadoConfirmacion,
  ResultadoValidacion,
} from './importacion-api.service';

type EstadoImportacion =
  | 'inicial'
  | 'archivo-seleccionado'
  | 'validando'
  | 'validado'
  | 'confirmando'
  | 'completado'
  | 'error';

interface OpcionEntidad {
  readonly id: EntidadImportacion;
  readonly nombre: string;
  readonly descripcion: string;
  readonly icono: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Component({
  selector: 'app-importacion',
  standalone: true,
  templateUrl: './importacion.component.html',
  styleUrl: './importacion.component.scss',
})
export class ImportacionComponent {
  private readonly api = inject(ImportacionApiService);

  protected readonly entidades: readonly OpcionEntidad[] = [
    { id: 'alumnos', nombre: 'Alumnos', descripcion: 'Matrículas y datos escolares', icono: 'school' },
    { id: 'profesores', nombre: 'Profesores', descripcion: 'Perfiles docentes', icono: 'badge' },
    { id: 'grados', nombre: 'Grados', descripcion: 'Estructura por ciclo', icono: 'stairs' },
    { id: 'grupos', nombre: 'Grupos', descripcion: 'Aulas y asignaciones', icono: 'meeting_room' },
    { id: 'materias', nombre: 'Materias', descripcion: 'Catálogo académico', icono: 'auto_stories' },
    { id: 'asistencias', nombre: 'Asistencias', descripcion: 'Registros por alumno y fecha', icono: 'fact_check' },
  ];
  protected readonly entidad = signal<EntidadImportacion>('asistencias');
  protected readonly archivo = signal<File | null>(null);
  protected readonly estado = signal<EstadoImportacion>('inicial');
  protected readonly resultado = signal<ResultadoValidacion | null>(null);
  protected readonly confirmacion = signal<ResultadoConfirmacion | null>(null);
  protected readonly fechaOperacion = signal<Date | null>(null);
  protected readonly mensajeError = signal('');

  protected readonly entidadActiva = computed(() =>
    this.entidades.find((item) => item.id === this.entidad()) ?? this.entidades[0],
  );
  protected readonly columnasVista = computed(() => {
    const columnas = new Set<string>();
    this.resultado()?.validos.slice(0, 8).forEach((registro) =>
      Object.keys(registro).forEach((campo) => columnas.add(campo)),
    );
    return [...columnas];
  });
  protected readonly validosVista = computed(() => this.resultado()?.validos.slice(0, 8) ?? []);
  protected readonly puedeConfirmar = computed(() =>
    this.estado() === 'validado' && (this.resultado()?.totalValidos ?? 0) > 0,
  );
  protected readonly ocupado = computed(() =>
    this.estado() === 'validando' || this.estado() === 'confirmando',
  );

  protected seleccionarEntidad(entidad: EntidadImportacion): void {
    if (this.entidad() === entidad) return;
    this.entidad.set(entidad);
    this.reiniciarArchivo();
  }

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (archivo) this.seleccionarArchivo(archivo);
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const archivo = event.dataTransfer?.files[0];
    if (archivo) this.seleccionarArchivo(archivo);
  }

  protected seleccionarArchivo(archivo: File): void {
    this.resultado.set(null);
    this.confirmacion.set(null);
    this.mensajeError.set('');
    const extension = archivo.name.split('.').pop()?.toLowerCase();
    if (!extension || !['xlsx', 'csv'].includes(extension)) {
      this.archivo.set(null);
      this.estado.set('error');
      this.mensajeError.set('Selecciona un archivo Excel (.xlsx) o CSV.');
      return;
    }
    if (archivo.size > MAX_FILE_SIZE) {
      this.archivo.set(null);
      this.estado.set('error');
      this.mensajeError.set('El archivo supera el tamaño máximo permitido de 10 MB.');
      return;
    }
    this.archivo.set(archivo);
    this.estado.set('archivo-seleccionado');
  }

  protected async descargarPlantilla(): Promise<void> {
    this.mensajeError.set('');
    try {
      await this.api.descargarPlantilla(this.entidad());
    } catch (error) {
      this.manejarError(error);
    }
  }

  protected async validar(): Promise<void> {
    const archivo = this.archivo();
    if (!archivo || this.ocupado()) return;
    this.estado.set('validando');
    this.resultado.set(null);
    this.mensajeError.set('');
    try {
      this.resultado.set(await this.api.validarArchivo(this.entidad(), archivo));
      this.estado.set('validado');
    } catch (error) {
      this.manejarError(error);
    }
  }

  protected async confirmar(): Promise<void> {
    const validos = this.resultado()?.validos ?? [];
    if (!this.puedeConfirmar() || validos.length === 0) return;
    this.estado.set('confirmando');
    this.mensajeError.set('');
    try {
      this.confirmacion.set(await this.api.confirmar(this.entidad(), validos));
      this.fechaOperacion.set(new Date());
      this.estado.set('completado');
    } catch (error) {
      this.manejarError(error);
    }
  }

  protected reiniciar(): void {
    this.reiniciarArchivo();
  }

  protected formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected valorCelda(valor: unknown): string {
    if (Array.isArray(valor)) return valor.join(', ');
    if (valor === null || valor === undefined || valor === '') return '—';
    if (typeof valor === 'object') return JSON.stringify(valor);
    return String(valor);
  }

  protected filaError(error: ErrorImportacion, indice: number): string {
    return typeof error === 'string' ? 'General' : `Fila ${error.fila || indice + 2}`;
  }

  protected motivosError(error: ErrorImportacion): readonly string[] {
    return typeof error === 'string' ? [error] : error.motivos;
  }

  protected identificadorError(error: ErrorImportacion): string {
    if (typeof error === 'string') return '';
    for (const campo of ['matricula', 'correo', 'codigo', 'clave', 'nombre', 'fecha']) {
      const valor = error[campo];
      if (valor !== undefined && valor !== null && valor !== '') return String(valor);
    }
    return '';
  }

  protected fechaOperacionTexto(): string {
    return this.fechaOperacion()?.toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }) ?? '';
  }

  private reiniciarArchivo(): void {
    this.archivo.set(null);
    this.resultado.set(null);
    this.confirmacion.set(null);
    this.fechaOperacion.set(null);
    this.mensajeError.set('');
    this.estado.set('inicial');
  }

  private manejarError(error: unknown): void {
    this.estado.set('error');
    this.mensajeError.set(
      error instanceof ImportacionApiError || error instanceof Error
        ? error.message
        : 'Ocurrió un error inesperado durante la importación.',
    );
  }
}
