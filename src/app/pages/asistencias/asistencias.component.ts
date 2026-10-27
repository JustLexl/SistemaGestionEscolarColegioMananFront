
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

type EstadoAsistencia = 'Presente' | 'Ausente' | 'Justificada';
type TipoNotificacion = 'exito' | 'error';

interface RegistroAsistencia {
  id: number;
  fecha: string;
  estado: EstadoAsistencia;
}

interface AsistenciaAPI extends RegistroAsistencia {
  alumnoId: number;
}

interface AlumnoAPI {
  id: number;
  matricula: string;
  nombre: string;
  grado: string;
  grupo: string;
  tutor: string;
  estado: 'Activo' | 'Inactivo';
}

interface AlumnoAsistencia {
  id: number;
  matricula: string;
  nombre: string;
  grado: string;
  grupo: string;
  registros: RegistroAsistencia[];
}

interface RespuestaAPI<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

@Component({
  selector: 'app-asistencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencias.component.html',
  styleUrl: './asistencias.component.css',
})
export class AsistenciasComponent implements OnInit {

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private apiAlumnos = 'http://localhost:3000/api/alumnos';
  private apiAsistencias = 'http://localhost:3000/api/asistencias';

  alumnos: AlumnoAsistencia[] = [];

  busqueda = '';
  filtroGrado = '';
  filtroGrupo = '';
  filtroEstado = '';

  alumnoSeleccionado: AlumnoAsistencia | null = null;

  modalHistorialAbierto = false;
  modalRegistroAbierto = false;
  modalEliminarAbierto = false;

  modoEdicion = false;
  registroIdEditar: number | null = null;
  registroEliminar: RegistroAsistencia | null = null;

  // Notificaciones personalizadas
  notificacionVisible = false;
  mensajeNotificacion = '';
  tipoNotificacion: TipoNotificacion = 'exito';

  nuevoRegistro: { fecha: string; estado: EstadoAsistencia } = {
    fecha: '2026-10-13',
    estado: 'Presente',
  };

  ngOnInit(): void {
    this.cargarAsistencias();
  }

  mostrarNotificacion(
    mensaje: string,
    tipo: TipoNotificacion = 'exito'
  ): void {
    this.mensajeNotificacion = mensaje;
    this.tipoNotificacion = tipo;
    this.notificacionVisible = true;

    this.cdr.detectChanges();

    setTimeout(() => {
      this.notificacionVisible = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  cerrarNotificacion(): void {
    this.notificacionVisible = false;
    this.cdr.detectChanges();
  }

  cargarAsistencias(): void {
    forkJoin({
      respuestaAlumnos: this.http.get<RespuestaAPI<AlumnoAPI[]>>(
        this.apiAlumnos
      ),
      respuestaAsistencias: this.http.get<RespuestaAPI<AsistenciaAPI[]>>(
        this.apiAsistencias
      ),
    }).subscribe({
      next: ({ respuestaAlumnos, respuestaAsistencias }) => {

        const alumnos = respuestaAlumnos.data;
        const asistencias = respuestaAsistencias.data;

        this.alumnos = alumnos.map((alumno) => ({
          id: alumno.id,
          matricula: alumno.matricula,
          nombre: alumno.nombre,
          grado: alumno.grado,
          grupo: alumno.grupo,
          registros: asistencias
            .filter((asistencia) => asistencia.alumnoId === alumno.id)
            .map((asistencia) => ({
              id: asistencia.id,
              fecha: asistencia.fecha,
              estado: asistencia.estado,
            })),
        }));

        if (this.alumnoSeleccionado) {
          const alumnoId = this.alumnoSeleccionado.id;

          this.alumnoSeleccionado =
            this.alumnos.find(
              (alumno) => alumno.id === alumnoId
            ) ?? null;
        }

        console.log('Alumnos cargados:', this.alumnos.length);
        console.log('Asistencias cargadas:', asistencias.length);

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar asistencias:', error);
        this.mostrarNotificacion(
          'Error al cargar los datos de asistencias.',
          'error'
        );
      },
    });
  }

  get gradosDisponibles(): string[] {
    return [...new Set(this.alumnos.map((a) => a.grado))].sort();
  }

  get gruposDisponibles(): string[] {
    return [
      ...new Set(
        this.alumnos
          .filter((a) => !this.filtroGrado || a.grado === this.filtroGrado)
          .map((a) => a.grupo),
      ),
    ].sort();
  }

  get alumnosFiltrados(): AlumnoAsistencia[] {
    const texto = this.busqueda.toLowerCase().trim();

    return this.alumnos.filter((alumno) => {
      const coincideBusqueda =
        !texto ||
        alumno.nombre.toLowerCase().includes(texto) ||
        alumno.matricula.toLowerCase().includes(texto);

      const coincideGrado =
        !this.filtroGrado || alumno.grado === this.filtroGrado;

      const coincideGrupo =
        !this.filtroGrupo || alumno.grupo === this.filtroGrupo;

      const coincideEstado =
        !this.filtroEstado ||
        this.ultimaAsistencia(alumno) === this.filtroEstado;

      return (
        coincideBusqueda && coincideGrado && coincideGrupo && coincideEstado
      );
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroGrado = '';
    this.filtroGrupo = '';
    this.filtroEstado = '';

    this.mostrarNotificacion('Filtros restablecidos.');
  }

  get totalFaltas(): number {
    return this.alumnos.reduce(
      (total, alumno) => total + this.contarFaltas(alumno),
      0,
    );
  }

  get totalPresentes(): number {
    return this.alumnos.filter(
      (alumno) => this.ultimaAsistencia(alumno) === 'Presente',
    ).length;
  }

  contarFaltas(alumno: AlumnoAsistencia): number {
    return alumno.registros.filter(
      (registro) => registro.estado === 'Ausente'
    ).length;
  }

  ultimaAsistencia(alumno: AlumnoAsistencia): string {
    const registros = this.ordenarRegistros(alumno);
    return registros.length ? registros[0].estado : 'Sin registros';
  }

  ordenarRegistros(alumno: AlumnoAsistencia): RegistroAsistencia[] {
    return [...alumno.registros].sort(
      (a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id,
    );
  }

  consultarHistorial(alumno: AlumnoAsistencia): void {
    this.alumnoSeleccionado = alumno;
    this.modalHistorialAbierto = true;
  }

  cerrarHistorial(): void {
    this.modalHistorialAbierto = false;
    this.alumnoSeleccionado = null;
  }

  abrirRegistro(alumno?: AlumnoAsistencia): void {
    if (alumno) {
      this.alumnoSeleccionado = alumno;
    } else {
      this.alumnoSeleccionado = null;
    }

    this.modoEdicion = false;
    this.registroIdEditar = null;

    this.nuevoRegistro = {
      fecha: new Date().toLocaleDateString('en-CA'),
      estado: 'Presente',
    };

    this.modalRegistroAbierto = true;
  }

  editarRegistro(
    registro: RegistroAsistencia,
    alumno?: AlumnoAsistencia,
  ): void {
    if (alumno) {
      this.alumnoSeleccionado = alumno;
    }

    this.modoEdicion = true;
    this.registroIdEditar = registro.id;

    this.nuevoRegistro = {
      fecha: registro.fecha,
      estado: registro.estado,
    };

    this.modalRegistroAbierto = true;
  }

  seleccionarAlumno(id: number | string): void {
    this.alumnoSeleccionado =
      this.alumnos.find((alumno) => alumno.id === Number(id)) ?? null;
  }

  guardarRegistro(): void {
    if (!this.alumnoSeleccionado || !this.nuevoRegistro.fecha) {
      this.mostrarNotificacion(
        'Selecciona un alumno y una fecha.',
        'error'
      );
      return;
    }

    // EDITAR ASISTENCIA CON PUT
    if (this.modoEdicion) {
      if (this.registroIdEditar === null) {
        this.mostrarNotificacion(
          'No se encontró la asistencia que deseas editar.',
          'error'
        );
        return;
      }

      const datosActualizados = {
        fecha: this.nuevoRegistro.fecha,
        estado: this.nuevoRegistro.estado
      };

      this.http.put<RespuestaAPI<AsistenciaAPI>>(
        `${this.apiAsistencias}/${this.registroIdEditar}`,
        datosActualizados
      ).subscribe({
        next: () => {
          this.modalRegistroAbierto = false;
          this.cargarAsistencias();
          this.mostrarNotificacion(
            'Asistencia actualizada correctamente.'
          );
        },
        error: (error) => {
          console.error('Error al actualizar asistencia:', error);
          this.mostrarNotificacion(
            error.error?.message || 'Error al actualizar la asistencia.',
            'error'
          );
        }
      });

      return;
    }

    // REGISTRAR ASISTENCIA CON POST
    const datosAsistencia = {
      alumnoId: this.alumnoSeleccionado.id,
      fecha: this.nuevoRegistro.fecha,
      estado: this.nuevoRegistro.estado
    };

    this.http.post<RespuestaAPI<AsistenciaAPI>>(
      this.apiAsistencias,
      datosAsistencia
    ).subscribe({
      next: () => {
        this.modalRegistroAbierto = false;
        this.cargarAsistencias();
        this.mostrarNotificacion(
          'Asistencia registrada correctamente.'
        );
      },
      error: (error) => {
        console.error('Error al registrar asistencia:', error);
        this.mostrarNotificacion(
          error.error?.message || 'Error al registrar la asistencia.',
          'error'
        );
      }
    });
  }

  eliminarRegistro(
    registro: RegistroAsistencia,
    alumno?: AlumnoAsistencia,
  ): void {
    if (alumno) {
      this.alumnoSeleccionado = alumno;
    }

    this.registroEliminar = registro;
    this.modalEliminarAbierto = true;
  }

  // ELIMINAR ASISTENCIA CON DELETE
  confirmarEliminar(): void {
    if (!this.alumnoSeleccionado || !this.registroEliminar) {
      return;
    }

    const registroId = this.registroEliminar.id;

    this.http.delete(
      `${this.apiAsistencias}/${registroId}`
    ).subscribe({
      next: () => {
        this.modalEliminarAbierto = false;
        this.registroEliminar = null;

        this.cargarAsistencias();

        this.mostrarNotificacion(
          'Asistencia eliminada correctamente.'
        );
      },
      error: (error) => {
        console.error('Error al eliminar asistencia:', error);
        this.mostrarNotificacion(
          error.error?.message || 'Error al eliminar la asistencia.',
          'error'
        );
      }
    });
  }

  cancelarEliminar(): void {
    this.modalEliminarAbierto = false;
    this.registroEliminar = null;
  }
}
