import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Alumno {
  id: number;
  matricula: string;
  nombre: string;
  grado: string;
  grupo: string;
  tutor: string;
  estado: 'Activo' | 'Inactivo';
}

interface RespuestaAPI<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alumnos.component.html',
  styleUrl: './alumnos.component.css'
})
export class AlumnosComponent implements OnInit {

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = 'http://localhost:3000/api/alumnos';

  alumnos: Alumno[] = [];

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

  ngOnInit(): void {
    console.log('Componente Alumnos iniciado');
    this.cargarAlumnos();
  }

  cargarAlumnos(): void {
    console.log('Solicitando alumnos al backend...');

    this.http.get<RespuestaAPI<Alumno[]>>(this.apiUrl).subscribe({
      next: (respuesta) => {
        console.log('Respuesta del backend:', respuesta);

        this.alumnos = respuesta.data;
        this.cdr.detectChanges();

        console.log('Alumnos cargados en Angular:', this.alumnos);
        console.log('Cantidad de alumnos:', this.alumnos.length);
      },
      error: (error) => {
        console.error('Error al cargar alumnos:', error);
        this.mostrarMensaje('Error al cargar los alumnos.');
      }
    });
  }

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
      !this.nuevoAlumno.matricula.trim() ||
      !this.nuevoAlumno.nombre.trim() ||
      !this.nuevoAlumno.grado ||
      !this.nuevoAlumno.grupo ||
      !this.nuevoAlumno.tutor.trim()
    ) {
      this.mostrarMensaje('Complete todos los campos obligatorios.');
      return;
    }

    if (this.modoEdicion) {
      this.http.put<RespuestaAPI<Alumno>>(
        `${this.apiUrl}/${this.nuevoAlumno.id}`,
        this.nuevoAlumno
      ).subscribe({
        next: () => {
          this.cargarAlumnos();
          this.cerrarRegistro();
          this.mostrarMensaje(
            'Información del alumno actualizada correctamente.'
          );
        },
        error: (error) => {
          console.error('Error al actualizar alumno:', error);
          this.mostrarMensaje(
            error.error?.message || 'Error al actualizar el alumno.'
          );
        }
      });
    } else {
      const { id, ...datosAlumno } = this.nuevoAlumno;

      this.http.post<RespuestaAPI<Alumno>>(
        this.apiUrl,
        datosAlumno
      ).subscribe({
        next: () => {
          this.cargarAlumnos();
          this.cerrarRegistro();
          this.mostrarMensaje('Alumno registrado correctamente.');
        },
        error: (error) => {
          console.error('Error al registrar alumno:', error);
          this.mostrarMensaje(
            error.error?.message || 'Error al registrar el alumno.'
          );
        }
      });
    }
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

    const alumnoId = this.alumnoSeleccionado.id;

    this.http.patch<RespuestaAPI<Alumno>>(
      `${this.apiUrl}/${alumnoId}/dar-de-baja`,
      {}
    ).subscribe({
      next: () => {
        this.cargarAlumnos();
        this.modalBajaAbierto = false;
        this.alumnoSeleccionado = null;
        this.mostrarMensaje('Alumno dado de baja correctamente.');
      },
      error: (error) => {
        console.error('Error al dar de baja alumno:', error);
        this.mostrarMensaje(
          error.error?.message || 'Error al dar de baja al alumno.'
        );
      }
    });
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

    this.cdr.detectChanges();

    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}