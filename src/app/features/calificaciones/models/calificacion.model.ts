export interface Calificacion {
  readonly id: string;
  readonly alumno: string;
  readonly matricula: string;
  readonly grado: string;
  readonly grupo: string;
  readonly materia: string;
  readonly periodo: string;
  readonly calificacion: number;
}

export type CalificacionDatos = Omit<Calificacion, 'id'>;
