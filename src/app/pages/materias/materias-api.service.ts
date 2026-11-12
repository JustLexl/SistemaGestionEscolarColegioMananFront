import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { CicloEscolar } from '../ciclos-escolares/ciclos-escolares-api.service';
import { Grupo, ProfesorResumen } from '../grados-grupos/grados-grupos-api.service';

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

export type EstadoMateria = 'Activa' | 'En planeacion' | 'Inactiva';

export interface MateriaGrado {
  readonly id: string;
  readonly nombre: string;
  readonly nivel: 'Primaria' | 'Secundaria';
  readonly numeroGrado: number;
}

export interface MateriaGrupo {
  readonly id: number;
  readonly nombre: string;
  readonly grupoLetra: string;
  readonly gradoId: string;
  readonly gradoNombre: string;
}

export interface MateriaProfesor {
  readonly id: number;
  readonly nombre: string;
  readonly cedula: string;
  readonly estado: 'Activo' | 'Inactivo';
}

export interface Materia {
  readonly id: number;
  readonly codigo: string;
  readonly nombre: string;
  readonly claveSep: string;
  readonly cargaHoraria: string;
  readonly grupoIds: readonly number[];
  readonly profesorId: number | null;
  readonly estado: EstadoMateria;
  readonly isTroncoComun: boolean;
  readonly grupos: readonly MateriaGrupo[];
  readonly grados: readonly MateriaGrado[];
  readonly cicloEscolar: CicloEscolar;
  readonly profesor: MateriaProfesor | null;
  readonly gruposCount: number;
}

export interface MateriasMetricas {
  readonly total: number;
  readonly activas: number;
  readonly enPlaneacion: number;
  readonly inactivas: number;
  readonly profesoresAsignados: number;
  readonly gruposConMaterias: number;
}

export interface MateriaPayload {
  readonly nombre: string;
  readonly codigo: string;
  readonly claveSep: string;
  readonly cargaHoraria: string;
  readonly grupoIds: readonly number[];
  readonly profesorId: number | null;
  readonly estado: EstadoMateria;
  readonly isTroncoComun: boolean;
}

export class MateriasApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'MateriasApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class MateriasApiService {
  obtenerMaterias(): Promise<readonly Materia[]> {
    return this.request<readonly Materia[]>('/materias');
  }

  obtenerMateria(id: number): Promise<Materia> {
    return this.request<Materia>(`/materias/${id}`);
  }

  obtenerMetricas(): Promise<MateriasMetricas> {
    return this.request<MateriasMetricas>('/materias/metrics');
  }

  obtenerCiclos(): Promise<readonly CicloEscolar[]> {
    return this.request<readonly CicloEscolar[]>('/ciclos-escolares');
  }

  obtenerGrupos(): Promise<readonly Grupo[]> {
    return this.request<readonly Grupo[]>('/grupos');
  }

  obtenerProfesores(): Promise<readonly ProfesorResumen[]> {
    return this.request<readonly ProfesorResumen[]>('/profesores');
  }

  crearMateria(payload: MateriaPayload): Promise<Materia> {
    return this.request<Materia>('/materias', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  actualizarMateria(id: number, payload: MateriaPayload): Promise<Materia> {
    return this.request<Materia>(`/materias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  darDeBaja(id: number): Promise<Materia> {
    return this.request<Materia>(`/materias/${id}/dar-de-baja`, { method: 'PATCH' });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: init.body
          ? { 'Content-Type': 'application/json', ...init.headers }
          : init.headers,
      });
    } catch {
      throw new MateriasApiError(
        0,
        'No fue posible conectar con el backend escolar. Verifica que esté encendido.',
      );
    }

    let payload: ApiResponse<T> | null = null;
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      // La validación inferior genera un error controlado para respuestas inválidas.
    }
    if (!response.ok || payload?.success === false) {
      throw new MateriasApiError(
        response.status,
        payload?.error || payload?.message || `La solicitud falló con estado ${response.status}.`,
      );
    }
    if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
      throw new MateriasApiError(response.status, 'El backend devolvió una respuesta sin datos.');
    }
    return payload.data as T;
  }
}
