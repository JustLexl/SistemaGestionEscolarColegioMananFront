import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type EstadoAsistencia = 'Presente' | 'Ausente' | 'Justificada';

interface RegistroAsistencia {
  id: number;
  fecha: string;
  estado: EstadoAsistencia;
}

interface AlumnoAsistencia {
  id: number;
  matricula: string;
  nombre: string;
  grado: string;
  grupo: string;
  registros: RegistroAsistencia[];
}

@Component({
  selector: 'app-asistencias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './asistencias.component.html',
  styleUrl: './asistencias.component.css',
})
export class AsistenciasComponent {
  alumnos: AlumnoAsistencia[] = [
    {
      id: 1,
      matricula: 'CM-2026-001',
      nombre: 'Sofía Hernández López',
      grado: '4° Primaria',
      grupo: 'Grupo A',
      registros: [
        { id: 1, fecha: '2026-10-13', estado: 'Presente' },
        { id: 2, fecha: '2026-10-12', estado: 'Ausente' },
        { id: 3, fecha: '2026-10-09', estado: 'Presente' },
      ],
    },
    {
      id: 2,
      matricula: 'CM-2026-002',
      nombre: 'Mateo García Pérez',
      grado: '4° Primaria',
      grupo: 'Grupo B',
      registros: [
        { id: 4, fecha: '2026-10-13', estado: 'Ausente' },
        { id: 5, fecha: '2026-10-12', estado: 'Presente' },
      ],
    },
    {
      id: 3,
      matricula: 'CM-2026-003',
      nombre: 'Valentina Martínez Ruiz',
      grado: '3° Primaria',
      grupo: 'Grupo A',
      registros: [{ id: 6, fecha: '2026-10-13', estado: 'Presente' }],
    },
    {
      id: 4,
      matricula: 'CM-2026-004',
      nombre: 'Sebastián Torres Díaz',
      grado: '5° Primaria',
      grupo: 'Grupo A',
      registros: [
        { id: 7, fecha: '2026-10-13', estado: 'Presente' },
        { id: 8, fecha: '2026-10-12', estado: 'Ausente' },
      ],
    },
    {
      id: 5,
      matricula: 'CM-2026-005',
      nombre: 'Camila Sánchez Moreno',
      grado: '6° Primaria',
      grupo: 'Grupo A',
      registros: [],
    },
  ];

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

  nuevoRegistro: { fecha: string; estado: EstadoAsistencia } = {
    fecha: '2026-10-13',
    estado: 'Presente',
  };

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
    return alumno.registros.filter((registro) => registro.estado === 'Ausente')
      .length;
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
      alert('Selecciona un alumno y una fecha.');
      return;
    }

    const registros = this.alumnoSeleccionado.registros;

    if (this.modoEdicion) {
      const registro = registros.find((r) => r.id === this.registroIdEditar);

      if (registro) {
        registro.fecha = this.nuevoRegistro.fecha;
        registro.estado = this.nuevoRegistro.estado;
      }
    } else {
      registros.push({
        id: Date.now(),
        fecha: this.nuevoRegistro.fecha,
        estado: this.nuevoRegistro.estado,
      });
    }

    this.modalRegistroAbierto = false;
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

  confirmarEliminar(): void {
    if (!this.alumnoSeleccionado || !this.registroEliminar) return;

    this.alumnoSeleccionado.registros =
      this.alumnoSeleccionado.registros.filter(
        (r) => r.id !== this.registroEliminar?.id,
      );

    this.modalEliminarAbierto = false;
    this.registroEliminar = null;
  }

  cancelarEliminar(): void {
    this.modalEliminarAbierto = false;
    this.registroEliminar = null;
  }
}
