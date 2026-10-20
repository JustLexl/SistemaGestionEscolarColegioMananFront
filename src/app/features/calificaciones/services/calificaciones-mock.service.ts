import { Injectable, computed, signal } from '@angular/core';
import { Calificacion, CalificacionDatos } from '../models/calificacion.model';

export class CalificacionDuplicadaError extends Error {
  constructor() {
    super('Ya existe una calificación para este alumno, materia y periodo.');
    this.name = 'CalificacionDuplicadaError';
  }
}

export class CalificacionInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalificacionInvalidaError';
  }
}

const DEMO: readonly Calificacion[] = [
  {
    id: 'cal-001',
    alumno: 'Alumno Demo 01',
    matricula: 'ALU-DEMO-001',
    grado: '1°',
    grupo: 'A',
    materia: 'Matemáticas',
    periodo: '1er Trimestre',
    calificacion: 9.2,
  },
  {
    id: 'cal-002',
    alumno: 'Alumno Demo 02',
    matricula: 'ALU-DEMO-002',
    grado: '2°',
    grupo: 'B',
    materia: 'Lengua',
    periodo: '1er Trimestre',
    calificacion: 8.5,
  },
  {
    id: 'cal-003',
    alumno: 'Alumno Demo 03',
    matricula: 'ALU-DEMO-003',
    grado: '3°',
    grupo: 'A',
    materia: 'Historia',
    periodo: '1er Trimestre',
    calificacion: 7.8,
  },
  {
    id: 'cal-004',
    alumno: 'Alumno Demo 04',
    matricula: 'ALU-DEMO-004',
    grado: '1°',
    grupo: 'B',
    materia: 'Ciencias',
    periodo: '1er Trimestre',
    calificacion: 9.7,
  },
];

@Injectable({ providedIn: 'root' })
export class CalificacionesMockService {
  private readonly collection = signal<readonly Calificacion[]>(DEMO.map((item) => ({ ...item })));
  private nextId = 5;

  readonly calificaciones = this.collection.asReadonly();
  readonly total = computed(() => this.collection().length);
  readonly promedioGeneral = computed(() => {
    const items = this.collection();
    if (items.length === 0) return 0;
    return Number(
      (items.reduce((sum, item) => sum + item.calificacion, 0) / items.length).toFixed(1),
    );
  });
  readonly materiasEvaluadas = computed(
    () => new Set(this.collection().map((item) => item.materia)).size,
  );

  obtenerCalificaciones(): readonly Calificacion[] {
    return this.collection();
  }

  getCalificacionById(id: string): Calificacion | undefined {
    return this.collection().find((item) => item.id === id);
  }

  registrarCalificacion(datos: CalificacionDatos): Calificacion {
    const normalized = this.normalize(datos);
    this.ensureUnique(normalized);
    const created: Calificacion = {
      id: `cal-${String(this.nextId++).padStart(3, '0')}`,
      ...normalized,
    };
    this.collection.update((items) => [...items, created]);
    return created;
  }

  actualizarCalificacion(id: string, cambios: CalificacionDatos): Calificacion | undefined {
    if (!this.getCalificacionById(id)) return undefined;
    const normalized = this.normalize(cambios);
    this.ensureUnique(normalized, id);
    const updated: Calificacion = { id, ...normalized };
    this.collection.update((items) => items.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  eliminarCalificacion(id: string): boolean {
    if (!this.getCalificacionById(id)) return false;
    this.collection.update((items) => items.filter((item) => item.id !== id));
    return true;
  }

  private normalize(datos: CalificacionDatos): CalificacionDatos {
    const normalized = {
      alumno: this.requireText(datos.alumno, 'alumno'),
      matricula: this.requireText(datos.matricula, 'matrícula'),
      grado: this.requireText(datos.grado, 'grado'),
      grupo: this.requireText(datos.grupo, 'grupo'),
      materia: this.requireText(datos.materia, 'materia'),
      periodo: this.requireText(datos.periodo, 'periodo'),
      calificacion: datos.calificacion,
    };
    if (
      !Number.isFinite(normalized.calificacion) ||
      normalized.calificacion < 0 ||
      normalized.calificacion > 10 ||
      !Number.isInteger(normalized.calificacion * 10)
    ) {
      throw new CalificacionInvalidaError(
        'La calificación debe estar entre 0 y 10 y tener máximo un decimal.',
      );
    }
    return normalized;
  }

  private requireText(value: string, field: string): string {
    const normalized = value.trim();
    if (!normalized) throw new CalificacionInvalidaError(`El campo ${field} es obligatorio.`);
    return normalized;
  }

  private ensureUnique(datos: CalificacionDatos, currentId?: string): void {
    const duplicate = this.collection().some(
      (item) =>
        item.id !== currentId &&
        this.key(item.matricula, item.materia, item.periodo) ===
          this.key(datos.matricula, datos.materia, datos.periodo),
    );
    if (duplicate) throw new CalificacionDuplicadaError();
  }

  private key(matricula: string, materia: string, periodo: string): string {
    return [matricula, materia, periodo]
      .map((value) => value.trim().toLocaleLowerCase('es-MX'))
      .join('|');
  }
}
