import { Injectable, signal } from '@angular/core';
import { Profesor } from '../models/profesor.model';

export class CedulaProfesorDuplicadaError extends Error {
  constructor() {
    super('Ya existe un profesor con esta cédula.');
    this.name = 'CedulaProfesorDuplicadaError';
  }
}

@Injectable({ providedIn: 'root' })
export class ProfesoresMockService {
  private readonly _profesores = signal<readonly Profesor[]>([
    {
      id: 1,
      nombre: 'Docente Demo 01',
      cedula: 'DOC-DEMO-001',
      materiasAsignadas: ['Matemáticas', 'Física'],
      gruposAsignados: ['1.º A', '2.º B'],
      estado: 'Activo',
    },
    {
      id: 2,
      nombre: 'Docente Demo 02',
      cedula: 'DOC-DEMO-002',
      materiasAsignadas: ['Lengua'],
      gruposAsignados: ['3.º A', '3.º B'],
      estado: 'Activo',
    },
    {
      id: 3,
      nombre: 'Docente Demo 03',
      cedula: 'DOC-DEMO-003',
      materiasAsignadas: ['Historia'],
      gruposAsignados: ['5.º A'],
      estado: 'Inactivo',
    },
  ]);

  readonly profesores = this._profesores.asReadonly();

  getProfesorById(id: Profesor['id']): Profesor | undefined {
    return this._profesores().find((profesor) => profesor.id === id);
  }

  registrarProfesor(datos: Pick<Profesor, 'nombre' | 'cedula'>): Profesor {
    const nombre = datos.nombre.trim();
    const cedula = datos.cedula.trim();
    const cedulaNormalizada = this.normalizarCedula(cedula);

    if (
      this._profesores().some(
        (profesor) => this.normalizarCedula(profesor.cedula) === cedulaNormalizada,
      )
    ) {
      throw new CedulaProfesorDuplicadaError();
    }

    const nuevoProfesor: Profesor = {
      id: Math.max(0, ...this._profesores().map((profesor) => profesor.id)) + 1,
      nombre,
      cedula,
      materiasAsignadas: [],
      gruposAsignados: [],
      estado: 'Activo',
    };

    this._profesores.update((profesores) => [...profesores, nuevoProfesor]);

    return nuevoProfesor;
  }

  actualizarProfesor(
    id: Profesor['id'],
    cambios: Pick<Profesor, 'nombre' | 'cedula'>,
  ): Profesor | undefined {
    const profesorActual = this.getProfesorById(id);

    if (!profesorActual) {
      return undefined;
    }

    const nombre = cambios.nombre.trim();
    const cedula = cambios.cedula.trim();
    const cedulaNormalizada = this.normalizarCedula(cedula);
    const perteneceAOtroProfesor = this._profesores().some(
      (profesor) =>
        profesor.id !== id && this.normalizarCedula(profesor.cedula) === cedulaNormalizada,
    );

    if (perteneceAOtroProfesor) {
      throw new CedulaProfesorDuplicadaError();
    }

    const profesorActualizado: Profesor = {
      ...profesorActual,
      nombre,
      cedula,
    };

    this._profesores.update((profesores) =>
      profesores.map((profesor) => (profesor.id === id ? profesorActualizado : profesor)),
    );

    return profesorActualizado;
  }

  darDeBajaProfesor(id: Profesor['id']): Profesor | undefined {
    const profesorActual = this.getProfesorById(id);

    if (!profesorActual || profesorActual.estado === 'Inactivo') {
      return profesorActual;
    }

    const profesorInactivo: Profesor = {
      ...profesorActual,
      estado: 'Inactivo',
    };

    this._profesores.update((profesores) =>
      profesores.map((profesor) => (profesor.id === id ? profesorInactivo : profesor)),
    );

    return profesorInactivo;
  }

  private normalizarCedula(cedula: string): string {
    return cedula.trim().toLocaleLowerCase('es-MX');
  }
}
