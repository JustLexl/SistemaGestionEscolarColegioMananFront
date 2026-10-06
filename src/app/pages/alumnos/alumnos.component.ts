import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Alumno {
  id: number;
  matricula: string;
  nombre: string;
  grado: string;
  grupo: string;
  tutor: string;
  estado: 'Activo' | 'Inactivo';
}

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './alumnos.component.html',
  styleUrl: './alumnos.component.css'
})
export class AlumnosComponent {

  alumnos: Alumno[] = [
    {
      id: 1,
      matricula: 'CM-2026-001',
      nombre: 'Sofía Hernández López',
      grado: '4° Primaria',
      grupo: 'Grupo A',
      tutor: 'María López',
      estado: 'Activo'
    },
    {
      id: 2,
      matricula: 'CM-2026-002',
      nombre: 'Mateo García Pérez',
      grado: '4° Primaria',
      grupo: 'Grupo B',
      tutor: 'Carlos García',
      estado: 'Activo'
    },
    {
      id: 3,
      matricula: 'CM-2026-003',
      nombre: 'Valentina Martínez Ruiz',
      grado: '3° Primaria',
      grupo: 'Grupo A',
      tutor: 'Laura Ruiz',
      estado: 'Activo'
    },
    {
      id: 4,
      matricula: 'CM-2026-004',
      nombre: 'Sebastián Torres Díaz',
      grado: '5° Primaria',
      grupo: 'Grupo A',
      tutor: 'Andrea Díaz',
      estado: 'Activo'
    },
    {
      id: 5,
      matricula: 'CM-2026-005',
      nombre: 'Camila Sánchez Moreno',
      grado: '6° Primaria',
      grupo: 'Grupo A',
      tutor: 'Miguel Sánchez',
      estado: 'Inactivo'
    }
  ];

  busqueda = '';
  filtroGrado = '';
  filtroGrupo = '';
  filtroEstado = '';

  modalRegistroAbierto = false;
  modalBajaAbierto = false;
  modoEdicion = false;
  modalConsultaAbierto = false;

  alumnoSeleccionado: Alumno | null = null;

  nuevoAlumno: Alumno = this.crearAlumnoVacio();

  mensajeToast = '';
  mostrarToast = false;

  crearAlumnoVacio(): Alumno {
    return {
      id: 0,
      matricula: '',
      nombre: '',
      grado: '',
      grupo: '',
      tutor: '',
      estado: 'Activo'
    };
  }

  get alumnosFiltrados(): Alumno[] {
    const texto = this.busqueda.toLowerCase().trim();

    return this.alumnos.filter(alumno => {
      const coincideBusqueda =
        !texto ||
        alumno.nombre.toLowerCase().includes(texto) ||
        alumno.matricula.toLowerCase().includes(texto);

      const coincideGrado =
        !this.filtroGrado ||
        alumno.grado === this.filtroGrado;

      const coincideGrupo =
        !this.filtroGrupo ||
        alumno.grupo === this.filtroGrupo;

      const coincideEstado =
        !this.filtroEstado ||
        alumno.estado === this.filtroEstado;

      return (
        coincideBusqueda &&
        coincideGrado &&
        coincideGrupo &&
        coincideEstado
      );
    });
  }

  get totalActivos(): number {
    return this.alumnos.filter(
      alumno => alumno.estado === 'Activo'
    ).length;
  }

  get totalGrupos(): number {
    return new Set(
      this.alumnos
        .filter(alumno => alumno.grupo)
        .map(alumno => `${alumno.grado}-${alumno.grupo}`)
    ).size;
  }

  abrirRegistro(): void {
    this.modoEdicion = false;
    this.nuevoAlumno = this.crearAlumnoVacio();
    this.modalRegistroAbierto = true;
  }

  cerrarRegistro(): void {
    this.modalRegistroAbierto = false;
    this.modoEdicion = false;
  }

  guardarAlumno(): void {
    if (
      !this.nuevoAlumno.matricula ||
      !this.nuevoAlumno.nombre ||
      !this.nuevoAlumno.grado ||
      !this.nuevoAlumno.grupo ||
      !this.nuevoAlumno.tutor
    ) {
      this.mostrarMensaje(
        'Complete todos los campos obligatorios.'
      );
      return;
    }

    if (this.modoEdicion) {
      const indice = this.alumnos.findIndex(
        alumno => alumno.id === this.nuevoAlumno.id
      );

      if (indice !== -1) {
        this.alumnos[indice] = { ...this.nuevoAlumno };
      }

      this.mostrarMensaje(
        'Información del alumno actualizada correctamente.'
      );
    } else {
      const alumno: Alumno = {
        ...this.nuevoAlumno,
        id: Date.now()
      };

      this.alumnos.push(alumno);

      this.mostrarMensaje(
        'Alumno registrado correctamente.'
      );
    }

    this.cerrarRegistro();
  }

  editarAlumno(alumno: Alumno): void {
    this.modoEdicion = true;
    this.nuevoAlumno = { ...alumno };
    this.modalRegistroAbierto = true;
  }

  consultarAlumno(alumno: Alumno): void {
  this.alumnoSeleccionado = alumno;
  this.modalConsultaAbierto = true;
  }

  cerrarConsulta(): void {
  this.modalConsultaAbierto = false;
  this.alumnoSeleccionado = null;
  }

  solicitarBaja(alumno: Alumno): void {
    this.alumnoSeleccionado = alumno;
    this.modalBajaAbierto = true;
  }

  cancelarBaja(): void {
    this.modalBajaAbierto = false;
    this.alumnoSeleccionado = null;
  }

  confirmarBaja(): void {
    if (!this.alumnoSeleccionado) {
      return;
    }

    const alumno = this.alumnos.find(
      item => item.id === this.alumnoSeleccionado?.id
    );

    if (alumno) {
      alumno.estado = 'Inactivo';
    }

    this.modalBajaAbierto = false;

    this.mostrarMensaje(
      'Alumno dado de baja correctamente.'
    );

    this.alumnoSeleccionado = null;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroGrado = '';
    this.filtroGrupo = '';
    this.filtroEstado = '';

    this.mostrarMensaje('Filtros restablecidos.');
  }

  mostrarMensaje(mensaje: string): void {
    this.mensajeToast = mensaje;
    this.mostrarToast = true;

    setTimeout(() => {
      this.mostrarToast = false;
    }, 3000);
  }
}