import { Injectable } from '@angular/core';
import { Calificacion, CalificacionDatos } from '../models/calificacion.model';

export interface AlumnoApi {
  readonly id: number | string;
  readonly matricula: string;
  readonly nombre: string;
  readonly grado: string;
  readonly grupo: string;
}

export interface MateriaApi {
  readonly id: number | string;
  readonly nombre: string;
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

export class CalificacionesApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'CalificacionesApiError';
  }
}

const API_BASE_URL = 'http://localhost:3001/api';

@Injectable({ providedIn: 'root' })
export class CalificacionesApiService {
  obtenerCalificaciones(): Promise<readonly Calificacion[]> {
    return this.request<readonly Calificacion[]>('/calificaciones');
  }

  obtenerCalificacion(id: string): Promise<Calificacion> {
    return this.request<Calificacion>(
      `/calificaciones/${encodeURIComponent(id)}`,
    );
  }

  registrarCalificacion(datos: CalificacionDatos): Promise<Calificacion> {
    return this.request<Calificacion>('/calificaciones', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  actualizarCalificacion(
    id: string,
    datos: CalificacionDatos,
  ): Promise<Calificacion> {
    return this.request<Calificacion>(
      `/calificaciones/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(datos),
      },
    );
  }

  async eliminarCalificacion(id: string): Promise<void> {
    await this.request<undefined>(
      `/calificaciones/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
      false,
    );
  }

  obtenerAlumnos(): Promise<readonly AlumnoApi[]> {
    return this.request<readonly AlumnoApi[]>('/alumnos');
  }

  obtenerMaterias(): Promise<readonly MateriaApi[]> {
    return this.request<readonly MateriaApi[]>('/materias');
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    expectsData = true,
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: init.body
          ? { 'Content-Type': 'application/json', ...init.headers }
          : init.headers,
      });
    } catch {
      throw new CalificacionesApiError(
        0,
        'No fue posible conectar con el servidor de Calificaciones.',
      );
    }

    let payload: ApiResponse<T> | null = null;
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      // El manejo inferior reporta de forma uniforme respuestas vacías o inválidas.
    }

    if (!response.ok || payload?.success === false) {
      throw new CalificacionesApiError(
        response.status,
        payload?.error ||
          payload?.message ||
          `La solicitud falló con estado ${response.status}.`,
      );
    }

    if (
      expectsData &&
      (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data'))
    ) {
      throw new CalificacionesApiError(
        response.status,
        'El servidor devolvió una respuesta sin datos.',
      );
    }

    return payload?.data as T;
  }
}
