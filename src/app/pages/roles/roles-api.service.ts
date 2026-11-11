import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../../core/api/api-base-url';
import type { Rol } from './roles.component';

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly profesor?: unknown;
  readonly error?: string;
  readonly message?: string;
}

export interface RolFormData {
  readonly nombre: string;
  readonly puesto: Rol['puesto'];
  readonly correo: string;
  readonly estado: Rol['estado'];
  readonly cedula?: string;
}

export interface RolMutationResult {
  readonly usuario: Rol;
  readonly profesor: unknown | null;
}

export class RolesApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'RolesApiError';
  }
}

const API_URL = `${API_BASE_URL}/roles`;

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  obtenerRoles(): Promise<readonly Rol[]> {
    return this.request<readonly Rol[]>('');
  }

  async registrarRol(datos: RolFormData): Promise<RolMutationResult> {
    const payload = await this.requestWithPayload<Rol>('', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return { usuario: payload.data, profesor: payload.profesor ?? null };
  }

  async actualizarRol(id: number, datos: RolFormData): Promise<RolMutationResult> {
    const payload = await this.requestWithPayload<Rol>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
    return { usuario: payload.data, profesor: payload.profesor ?? null };
  }

  async cambiarEstado(id: number): Promise<RolMutationResult> {
    const payload = await this.requestWithPayload<Rol>(`/${id}/toggle-estado`, {
      method: 'PATCH',
    });
    return { usuario: payload.data, profesor: payload.profesor ?? null };
  }

  async eliminarRol(id: number): Promise<void> {
    await this.requestWithPayload<undefined>(`/${id}`, { method: 'DELETE' }, false);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    return (await this.requestWithPayload<T>(path, init)).data;
  }

  private async requestWithPayload<T>(
    path: string,
    init: RequestInit = {},
    expectsData = true,
  ): Promise<ApiResponse<T> & { readonly data: T }> {
    let response: Response;

    try {
      response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: init.body
          ? { 'Content-Type': 'application/json', ...init.headers }
          : init.headers,
      });
    } catch {
      throw new RolesApiError(0, 'No fue posible conectar con el servidor de Usuarios y Roles.');
    }

    let payload: ApiResponse<T> | null = null;
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      // La validación inferior normaliza respuestas vacías o inválidas.
    }

    if (!response.ok || payload?.success === false) {
      throw new RolesApiError(
        response.status,
        payload?.error || payload?.message || `La solicitud falló con estado ${response.status}.`,
      );
    }

    if (expectsData && (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data'))) {
      throw new RolesApiError(response.status, 'El servidor devolvió una respuesta sin datos.');
    }

    return (payload ?? { success: true, data: undefined as T }) as ApiResponse<T> & {
      readonly data: T;
    };
  }
}
