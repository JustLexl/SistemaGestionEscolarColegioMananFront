import { Injectable, signal } from '@angular/core';
import { API_BASE_URL } from '../api/api-base-url';

export interface AuthUsuario {
  readonly id: number | string;
  readonly nombre: string;
  readonly correo: string;
  readonly puesto: string;
  readonly rol: string;
  readonly estado: string;
}

interface LoginResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly token?: string;
  readonly usuario?: AuthUsuario;
}

interface ApiResponse {
  readonly success: boolean;
  readonly message?: string;
}

export class AuthApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const API_URL = `${API_BASE_URL}/auth`;
const TOKEN_KEY = 'colegio_demo_auth_token';
const USER_KEY = 'colegio_demo_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<AuthUsuario | null>(this.readUser());

  readonly usuario = this.currentUser.asReadonly();

  async login(email: string, password: string): Promise<AuthUsuario> {
    const payload = await this.request<LoginResponse>('/login', {
      email,
      password,
    });

    if (!payload.token || !payload.usuario) {
      throw new AuthApiError(
        200,
        'El servidor devolvió una sesión incompleta.',
      );
    }

    sessionStorage.setItem(TOKEN_KEY, payload.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(payload.usuario));
    this.currentUser.set(payload.usuario);
    return payload.usuario;
  }

  async logout(): Promise<void> {
    try {
      await this.request<ApiResponse>('/logout', {});
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      this.currentUser.set(null);
    }
  }

  private async request<T>(path: string, body: object): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new AuthApiError(
        0,
        'No fue posible conectar con el servidor de autenticación.',
      );
    }

    let payload: T & ApiResponse;
    try {
      payload = (await response.json()) as T & ApiResponse;
    } catch {
      throw new AuthApiError(
        response.status,
        'El servidor devolvió una respuesta inválida.',
      );
    }

    if (!response.ok || payload.success === false) {
      throw new AuthApiError(
        response.status,
        payload.message || 'No fue posible completar la autenticación.',
      );
    }

    return payload;
  }

  private readUser(): AuthUsuario | null {
    const stored = sessionStorage.getItem(USER_KEY);
    if (!stored || !sessionStorage.getItem(TOKEN_KEY)) return null;

    try {
      return JSON.parse(stored) as AuthUsuario;
    } catch {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
