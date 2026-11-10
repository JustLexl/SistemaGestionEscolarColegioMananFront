export type EstadoProfesor = 'Activo' | 'Inactivo';

export interface Profesor {
  readonly id: number;
  readonly usuarioId?: number | null;
  readonly nombre: string;
  readonly cedula: string;
  readonly materiasAsignadas: readonly string[];
  readonly gruposAsignados: readonly string[];
  readonly estado: EstadoProfesor;
}
