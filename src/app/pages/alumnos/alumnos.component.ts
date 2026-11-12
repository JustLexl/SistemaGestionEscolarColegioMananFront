import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api-base-url';

type EstadoCiclo = 'Planeacion' | 'Activo' | 'Finalizado';

interface CicloEscolar {
  id: number;
  nombre: string;
  estado: EstadoCiclo;
}

interface GradoAcademico {
  id: string;
  nombre: string;
  nivel: string;
  numeroGrado: number;
  cicloEscolarId: number;
}

interface GrupoAcademico {
  id: number;
  gradoId: string;
  nombre: string;
  grupoLetra: string;
  clave: string;
  turno: string;
  estado: 'Activo' | 'Inactivo';
  grado: GradoAcademico;
  cicloEscolarId: number;
  cicloEscolar: CicloEscolar;
}

interface Alumno {
  id: number;
  matricula: string;
  nombre: string;
  fechaNacimiento: string;
  grupoId: number;
  grupo: GrupoAcademico;
  grado: GradoAcademico;
  cicloEscolar: CicloEscolar;
  tutor: string;
  estado: 'Activo' | 'Inactivo';
}

interface AlumnoFormulario {
  id: number;
  matricula: string;
  nombre: string;
  fechaNacimiento: string;
  grupoId: number | null;
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
  private apiUrl = `${API_BASE_URL}/alumnos`;
  private gruposUrl = `${API_BASE_URL}/grupos`;
  private ciclosUrl = `${API_BASE_URL}/ciclos-escolares`;

  alumnos: Alumno[] = [];
  grupos: GrupoAcademico[] = [];
  ciclos: CicloEscolar[] = [];

  busqueda = '';
  filtroCiclo = '';
  filtroGrado = '';
  filtroGrupo = '';
  filtroEstado = '';
  gradoSeleccionadoId = '';

  modalRegistroAbierto = false;
  modalBajaAbierto = false;
  modoEdicion = false;
  modalConsultaAbierto = false;

  alumnoSeleccionado: Alumno | null = null;
  alumnoEditando: Alumno | null = null;
  nuevoAlumno: AlumnoFormulario = this.crearAlumnoVacio();

  mensajeToast = '';
  mostrarToast = false;
  readonly mensajeSinGrupos =
    'No hay grupos activos disponibles para registrar alumnos en el ciclo escolar actual.';
  readonly mensajeHistorial =
    'Este registro pertenece a un ciclo escolar finalizado. La asignación académica se conserva como historial.';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    forkJoin({
      alumnos: this.http.get<RespuestaAPI<Alumno[]>>(this.apiUrl),
      grupos: this.http.get<RespuestaAPI<GrupoAcademico[]>>(this.gruposUrl),
      ciclos: this.http.get<RespuestaAPI<CicloEscolar[]>>(this.ciclosUrl)
    }).subscribe({
      next: ({ alumnos, grupos, ciclos }) => {
        this.alumnos = alumnos.data;
        this.grupos = grupos.data;
        this.ciclos = ciclos.data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar datos académicos:', error);
        this.mostrarMensaje('Error al cargar los alumnos y catálogos académicos.');
      }
    });
  }

  cargarAlumnos(): void {
    this.http.get<RespuestaAPI<Alumno[]>>(this.apiUrl).subscribe({
      next: (respuesta) => {
        this.alumnos = respuesta.data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar alumnos:', error);
        this.mostrarMensaje('Error al cargar los alumnos.');
      }
    });
  }

  crearAlumnoVacio(): AlumnoFormulario {
    return {
      id: 0,
      matricula: '',
      nombre: '',
      fechaNacimiento: '',
      grupoId: null,
      tutor: '',
      estado: 'Activo'
    };
  }

  get cicloActivo(): CicloEscolar | null {
    return this.ciclos.find(ciclo => ciclo.estado === 'Activo') ?? null;
  }

  get ciclosFiltro(): CicloEscolar[] {
    const ids = new Set(this.alumnos.map(alumno => alumno.cicloEscolar?.id));
    return this.ciclos.filter(ciclo => ids.has(ciclo.id));
  }

  get gradosFiltro(): GradoAcademico[] {
    const alumnos = this.alumnos.filter(alumno =>
      !this.filtroCiclo || String(alumno.cicloEscolar?.id) === this.filtroCiclo
    );
    return this.gradosUnicos(alumnos.map(alumno => alumno.grado));
  }

  get gruposFiltro(): GrupoAcademico[] {
    if (!this.filtroGrado) return [];
    const grupos = this.alumnos
      .filter(alumno =>
        (!this.filtroCiclo || String(alumno.cicloEscolar?.id) === this.filtroCiclo) &&
        (!this.filtroGrado || String(alumno.grado?.id) === this.filtroGrado)
      )
      .map(alumno => alumno.grupo);
    return this.gruposUnicos(grupos);
  }

  get gruposActivosCiclo(): GrupoAcademico[] {
    const cicloId = this.modoEdicion
      ? this.alumnoEditando?.cicloEscolar?.id
      : this.cicloActivo?.id;
    if (!cicloId) return [];
    return this.grupos.filter(grupo =>
      grupo.estado === 'Activo' &&
      grupo.cicloEscolar?.estado === 'Activo' &&
      grupo.cicloEscolar.id === cicloId
    );
  }

  get gradosFormulario(): GradoAcademico[] {
    if (this.asignacionAcademicaBloqueada && this.alumnoEditando) {
      return [this.alumnoEditando.grado];
    }
    return this.gradosUnicos(this.gruposActivosCiclo.map(grupo => grupo.grado));
  }

  get gruposFormulario(): GrupoAcademico[] {
    if (this.asignacionAcademicaBloqueada && this.alumnoEditando) {
      return [this.alumnoEditando.grupo];
    }
    return this.gruposActivosCiclo.filter(
      grupo => !this.gradoSeleccionadoId || grupo.gradoId === this.gradoSeleccionadoId
    );
  }

  get asignacionAcademicaBloqueada(): boolean {
    return Boolean(
      this.modoEdicion && this.alumnoEditando?.cicloEscolar?.estado !== 'Activo'
    );
  }

  get sinGruposDisponibles(): boolean {
    return !this.modoEdicion && this.gruposActivosCiclo.length === 0;
  }

  get cicloFormulario(): CicloEscolar | null {
    return this.modoEdicion
      ? this.alumnoEditando?.cicloEscolar ?? null
      : this.cicloActivo;
  }

  get alumnosFiltrados(): Alumno[] {
    const texto = this.busqueda.toLowerCase().trim();
    return this.alumnos.filter(alumno =>
      (!texto || alumno.nombre.toLowerCase().includes(texto) ||
        alumno.matricula.toLowerCase().includes(texto)) &&
      (!this.filtroCiclo || String(alumno.cicloEscolar?.id) === this.filtroCiclo) &&
      (!this.filtroGrado || String(alumno.grado?.id) === this.filtroGrado) &&
      (!this.filtroGrupo || String(alumno.grupoId) === this.filtroGrupo) &&
      (!this.filtroEstado || alumno.estado === this.filtroEstado)
    );
  }

  get totalActivos(): number {
    return this.alumnos.filter(alumno => alumno.estado === 'Activo').length;
  }

  get totalGrupos(): number {
    return new Set(this.alumnos.map(alumno => alumno.grupoId)).size;
  }

  abrirRegistro(): void {
    this.modoEdicion = false;
    this.alumnoEditando = null;
    this.nuevoAlumno = this.crearAlumnoVacio();
    this.gradoSeleccionadoId = this.gradosFormulario[0]?.id ?? '';
    this.modalRegistroAbierto = true;
  }

  cerrarRegistro(): void {
    this.modalRegistroAbierto = false;
    this.modoEdicion = false;
    this.alumnoEditando = null;
  }

  cambiarGradoFormulario(): void {
    const pertenece = this.gruposFormulario.some(
      grupo => grupo.id === Number(this.nuevoAlumno.grupoId)
    );
    if (!pertenece) this.nuevoAlumno.grupoId = null;
  }

  cambiarCicloFiltro(): void {
    this.filtroGrado = '';
    this.filtroGrupo = '';
  }

  cambiarGradoFiltro(): void {
    this.filtroGrupo = '';
  }

  guardarAlumno(): void {
    if (
      !this.nuevoAlumno.matricula.trim() ||
      !this.nuevoAlumno.nombre.trim() ||
      (!this.nuevoAlumno.fechaNacimiento &&
        !(this.modoEdicion && this.alumnoEditando?.fechaNacimiento === '')) ||
      !this.nuevoAlumno.grupoId ||
      !this.nuevoAlumno.tutor.trim()
    ) {
      this.mostrarMensaje('Complete todos los campos obligatorios.');
      return;
    }

    const payload = {
      matricula: this.nuevoAlumno.matricula,
      nombre: this.nuevoAlumno.nombre,
      fechaNacimiento: this.nuevoAlumno.fechaNacimiento,
      tutor: this.nuevoAlumno.tutor,
      estado: this.nuevoAlumno.estado,
      ...(!this.asignacionAcademicaBloqueada && {
        grupoId: this.nuevoAlumno.grupoId
      })
    };

    const solicitud = this.modoEdicion
      ? this.http.put<RespuestaAPI<Alumno>>(
          `${this.apiUrl}/${this.nuevoAlumno.id}`,
          payload
        )
      : this.http.post<RespuestaAPI<Alumno>>(this.apiUrl, payload);

    const estabaEditando = this.modoEdicion;
    solicitud.subscribe({
      next: () => {
        this.cargarAlumnos();
        this.cerrarRegistro();
        this.mostrarMensaje(estabaEditando
          ? 'Información del alumno actualizada correctamente.'
          : 'Alumno registrado correctamente.');
      },
      error: (error) => {
        console.error('Error al guardar alumno:', error);
        this.mostrarMensaje(
          error.error?.error || error.error?.message || 'Error al guardar el alumno.'
        );
      }
    });
  }

  editarAlumno(alumno: Alumno): void {
    this.modoEdicion = true;
    this.alumnoEditando = alumno;
    this.gradoSeleccionadoId = alumno.grado.id;
    this.nuevoAlumno = {
      id: alumno.id,
      matricula: alumno.matricula,
      nombre: alumno.nombre,
      fechaNacimiento: alumno.fechaNacimiento,
      grupoId: alumno.grupoId,
      tutor: alumno.tutor,
      estado: alumno.estado
    };
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
    if (!this.alumnoSeleccionado) return;
    const alumnoId = this.alumnoSeleccionado.id;
    this.http.patch<RespuestaAPI<Alumno>>(
      `${this.apiUrl}/${alumnoId}/dar-de-baja`, {}
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
          error.error?.error || error.error?.message || 'Error al dar de baja al alumno.'
        );
      }
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroCiclo = '';
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

  private gradosUnicos(grados: GradoAcademico[]): GradoAcademico[] {
    return [...new Map(
      grados.filter(Boolean).map(grado => [grado.id, grado])
    ).values()].sort((a, b) =>
      a.nivel.localeCompare(b.nivel, 'es-MX') || a.numeroGrado - b.numeroGrado
    );
  }

  private gruposUnicos(grupos: GrupoAcademico[]): GrupoAcademico[] {
    return [...new Map(
      grupos.filter(Boolean).map(grupo => [grupo.id, grupo])
    ).values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
  }
}
