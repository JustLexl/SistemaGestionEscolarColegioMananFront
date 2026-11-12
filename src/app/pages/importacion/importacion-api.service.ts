import { Injectable } from '@angular/core';
import { API_BASE_URL } from '../../core/api/api-base-url';

export type EntidadImportacion =
  | 'alumnos'
  | 'profesores'
  | 'grados'
  | 'grupos'
  | 'materias'
  | 'asistencias';

export type RegistroImportacion = Readonly<Record<string, unknown>>;

export interface ErrorFilaImportacion {
  readonly fila: number;
  readonly motivos: readonly string[];
  readonly [campo: string]: unknown;
}

export type ErrorImportacion = string | ErrorFilaImportacion;

export interface ResultadoValidacion {
  readonly success: boolean;
  readonly mensaje: string;
  readonly totalRegistros: number;
  readonly totalValidos: number;
  readonly totalErrores: number;
  readonly validos: readonly RegistroImportacion[];
  readonly errores: readonly ErrorImportacion[];
}

export interface ResultadoConfirmacion {
  readonly success: boolean;
  readonly mensaje: string;
  readonly totalImportados: number;
  readonly [entidad: string]: unknown;
}

interface ApiErrorPayload {
  readonly success?: boolean;
  readonly mensaje?: string;
  readonly message?: string;
  readonly error?: string;
}

export class ImportacionApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ImportacionApiError';
  }
}

@Injectable({ providedIn: 'root' })
export class ImportacionApiService {
  async descargarPlantilla(entidad: EntidadImportacion): Promise<void> {
    const response = await this.fetchControlado(`/importacion/${entidad}/plantilla`);
    if (!response.ok) await this.lanzarError(response);

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const filename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1]
      || `plantilla_${entidad}.csv`;
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = filename;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  async validarArchivo(
    entidad: EntidadImportacion,
    archivo: File,
  ): Promise<ResultadoValidacion> {
    const form = new FormData();
    form.append('archivo', archivo);
    const response = await this.fetchControlado(`/importacion/${entidad}/validar`, {
      method: 'POST',
      body: form,
    });
    return this.leerJson<ResultadoValidacion>(response);
  }

  async confirmar(
    entidad: EntidadImportacion,
    validos: readonly RegistroImportacion[],
  ): Promise<ResultadoConfirmacion> {
    const response = await this.fetchControlado(`/importacion/${entidad}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validos }),
    });
    return this.leerJson<ResultadoConfirmacion>(response);
  }

  private async fetchControlado(path: string, init: RequestInit = {}): Promise<Response> {
    try {
      return await fetch(`${API_BASE_URL}${path}`, init);
    } catch {
      throw new ImportacionApiError(
        0,
        'No fue posible conectar con el backend escolar. Verifica que esté encendido.',
      );
    }
  }

  private async leerJson<T>(response: Response): Promise<T> {
    if (!response.ok) await this.lanzarError(response);
    try {
      return await response.json() as T;
    } catch {
      throw new ImportacionApiError(
        response.status,
        'El backend devolvió una respuesta que no se pudo interpretar.',
      );
    }
  }

  private async lanzarError(response: Response): Promise<never> {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = await response.json() as ApiErrorPayload;
    } catch {
      // Se utiliza el mensaje de estado cuando el cuerpo no es JSON.
    }
    const message = payload?.mensaje || payload?.message || payload?.error
      || `La solicitud falló con estado ${response.status}.`;
    throw new ImportacionApiError(response.status, message);
  }
}
