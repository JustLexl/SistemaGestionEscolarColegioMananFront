import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../../core/api/api-base-url';
import { CicloEscolar } from '../ciclos-escolares/ciclos-escolares-api.service';

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

export interface Grado {
  readonly id: string;
  readonly nombre: string;
  readonly nivel: 'Primaria' | 'Secundaria';
  readonly numeroGrado: number;
  readonly cicloEscolarId: number;
  readonly ciclo: string;
  readonly cicloEscolar: CicloEscolar;
}

export interface ProfesorResumen {
  readonly id: number;
  readonly usuarioId?: number | null;
  readonly nombre: string;
  readonly cedula: string;
  readonly estado: 'Activo' | 'Inactivo';
}

export interface Grupo {
  readonly id: number;
  readonly gradoId: string;
  readonly gradoNombre: string;
  readonly grupoLetra: string;
  readonly nombre: string;
  readonly clave: string;
  readonly aula: string;
  readonly edificio: string;
  readonly turno: 'matutino' | 'vespertino';
  readonly profesorId: number | null;
  readonly profesorNombre: string;
  readonly profesorIniciales: string;
  readonly cedula: string;
  readonly materias: readonly string[];
  readonly alumnosActuales: number;
  readonly alumnosMax: number;
  readonly estado: 'Activo' | 'Inactivo';
  readonly isBase: boolean;
  readonly grado: Grado;
  readonly cicloEscolarId: number;
  readonly cicloEscolar: CicloEscolar;
}

export interface GruposMetricas {
  readonly total: number;
  readonly activos: number;
  readonly gradosCount: number;
  readonly aulasCount: number;
  readonly matriculaTotal: number;
  readonly promedioAlumnos: number;
}

export interface GradoPayload {
  readonly nivel: 'Primaria' | 'Secundaria';
  readonly numeroGrado: number;
  readonly cicloEscolarId: number;
}

export interface GrupoPayload {
  readonly gradoId: string;
  readonly grupoLetra: string;
  readonly clave: string;
  readonly aula: string;
  readonly edificio: string;
  readonly turno: 'matutino' | 'vespertino';
  readonly profesorId: number | null;
  readonly alumnosMax: number;
  readonly estado: 'Activo' | 'Inactivo';
}

export class GradosGruposApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GradosGruposApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class GradosGruposApiService {
  obtenerGrados(): Promise<readonly Grado[]> {
    return this.obtener<readonly Grado[]>('/grados');
  }

  crearGrado(payload: GradoPayload): Promise<Grado> {
    return this.obtener<Grado>('/grados', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  actualizarGrado(id: string, payload: GradoPayload): Promise<Grado> {
    return this.obtener<Grado>(`/grados/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  obtenerGrupos(): Promise<readonly Grupo[]> {
    return this.obtener<readonly Grupo[]>('/grupos');
  }

  crearGrupo(payload: GrupoPayload): Promise<Grupo> {
    return this.obtener<Grupo>('/grupos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  actualizarGrupo(id: number, payload: GrupoPayload): Promise<Grupo> {
    return this.obtener<Grupo>(`/grupos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  cambiarEstadoGrupo(id: number): Promise<Grupo> {
    return this.obtener<Grupo>(`/grupos/${id}/toggle-estado`, { method: 'PATCH' });
  }

  obtenerMetricas(): Promise<GruposMetricas> {
    return this.obtener<GruposMetricas>('/grupos/metrics');
  }

  async obtenerProfesoresActivos(): Promise<readonly ProfesorResumen[]> {
    const profesores = await this.obtener<readonly ProfesorResumen[]>('/profesores');
    return profesores.filter((profesor) => profesor.estado === 'Activo');
  }

  private async obtener<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: init.body
          ? { 'Content-Type': 'application/json', ...init.headers }
          : init.headers,
      });
    } catch {
      throw new GradosGruposApiError(
        0,
        'No fue posible conectar con el backend escolar. Verifica que esté encendido.',
      );
    }

    let payload: ApiResponse<T> | null = null;
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      // La validación inferior convierte respuestas inválidas en un mensaje controlado.
    }

    if (!response.ok || payload?.success === false) {
      throw new GradosGruposApiError(
        response.status,
        payload?.error || payload?.message || `La solicitud falló con estado ${response.status}.`,
      );
    }

    if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
      throw new GradosGruposApiError(response.status, 'El backend devolvió una respuesta sin datos.');
    }

    return payload.data as T;
  }
}
