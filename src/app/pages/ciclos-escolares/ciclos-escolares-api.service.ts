import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../../core/api/api-base-url';

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

export type EstadoCiclo = 'Planeacion' | 'Activo' | 'Finalizado';

export interface CicloEscolar {
  readonly id: number;
  readonly nombre: string;
  readonly fechaInicio: string;
  readonly fechaFin: string;
  readonly estado: EstadoCiclo;
}

export interface CicloEscolarPayload {
  readonly nombre: string;
  readonly fechaInicio: string;
  readonly fechaFin: string;
}

export class CiclosEscolaresApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'CiclosEscolaresApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class CiclosEscolaresApiService {
  obtenerCiclos(): Promise<readonly CicloEscolar[]> {
    return this.obtener<readonly CicloEscolar[]>('/ciclos-escolares');
  }

  obtenerCiclo(id: number): Promise<CicloEscolar> {
    return this.obtener<CicloEscolar>(`/ciclos-escolares/${id}`);
  }

  crearCiclo(payload: CicloEscolarPayload): Promise<CicloEscolar> {
    return this.obtener<CicloEscolar>('/ciclos-escolares', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  actualizarCiclo(id: number, payload: CicloEscolarPayload): Promise<CicloEscolar> {
    return this.obtener<CicloEscolar>(`/ciclos-escolares/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
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
      throw new CiclosEscolaresApiError(
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
      throw new CiclosEscolaresApiError(
        response.status,
        payload?.error || payload?.message || `La solicitud falló con estado ${response.status}.`,
      );
    }
    if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
      throw new CiclosEscolaresApiError(response.status, 'El backend devolvió una respuesta sin datos.');
    }
    return payload.data as T;
  }
}
