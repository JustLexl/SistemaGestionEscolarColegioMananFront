import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CicloEscolar } from '../ciclos-escolares/ciclos-escolares-api.service';
import { Grupo, ProfesorResumen } from '../grados-grupos/grados-grupos-api.service';
import {
  EstadoMateria,
  Materia,
  MateriaPayload,
  MateriasApiError,
  MateriasApiService,
  MateriasMetricas,
} from './materias-api.service';

type ModalModo = 'crear' | 'editar' | 'consultar';

@Component({
  selector: 'app-materias',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './materias.component.html',
  styleUrl: './materias.component.css',
})
export class MateriasComponent implements OnInit {
  private readonly api = inject(MateriasApiService);

  protected readonly materias = signal<readonly Materia[]>([]);
  protected readonly ciclos = signal<readonly CicloEscolar[]>([]);
  protected readonly grupos = signal<readonly Grupo[]>([]);
  protected readonly profesores = signal<readonly ProfesorResumen[]>([]);
  protected readonly metricas = signal<MateriasMetricas>({
    total: 0,
    activas: 0,
    enPlaneacion: 0,
    inactivas: 0,
    profesoresAsignados: 0,
    gruposConMaterias: 0,
  });
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');
  protected readonly busqueda = signal('');
  protected readonly filtroCiclo = signal('');
  protected readonly filtroGrado = signal('');
  protected readonly filtroProfesor = signal('');
  protected readonly filtroEstado = signal('');
  protected readonly modalAbierto = signal(false);
  protected readonly modalModo = signal<ModalModo>('crear');
  protected readonly materiaSeleccionada = signal<Materia | null>(null);
  protected readonly cicloFormulario = signal('');

  protected readonly estados: readonly EstadoMateria[] = [
    'Activa',
    'En planeacion',
    'Inactiva',
  ];

  protected readonly formulario = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    codigo: new FormControl('', { nonNullable: true }),
    claveSep: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cargaHoraria: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cicloEscolarId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    grupoIds: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
    profesorId: new FormControl('', { nonNullable: true }),
    estado: new FormControl<EstadoMateria>('Activa', { nonNullable: true }),
    isTroncoComun: new FormControl(false, { nonNullable: true }),
  });

  protected readonly cicloActivo = computed(() =>
    this.ciclos().find((ciclo) => ciclo.estado === 'Activo') ?? null,
  );
  protected readonly ciclosConfigurables = computed(() =>
    this.ciclos().filter((ciclo) => ciclo.estado === 'Activo' || ciclo.estado === 'Planeacion'),
  );
  protected readonly profesoresActivos = computed(() =>
    this.profesores().filter((profesor) => profesor.estado === 'Activo'),
  );
  protected readonly gruposFormulario = computed(() => {
    const cicloId = Number(this.cicloFormulario());
    return this.grupos().filter((grupo) => Number(grupo.cicloEscolarId) === cicloId);
  });
  protected readonly gradosFiltro = computed(() => {
    const mapa = new Map<string, string>();
    this.grupos().forEach((grupo) => mapa.set(String(grupo.grado.id), grupo.grado.nombre));
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
  });
  protected readonly materiasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.materias().filter((materia) => {
      const coincideTexto = !texto || [materia.nombre, materia.claveSep, materia.codigo]
        .some((valor) => valor.toLowerCase().includes(texto));
      const coincideCiclo = !this.filtroCiclo() ||
        String(materia.cicloEscolar.id) === this.filtroCiclo();
      const coincideGrado = !this.filtroGrado() ||
        materia.grados.some((grado) => String(grado.id) === this.filtroGrado());
      const coincideProfesor = !this.filtroProfesor() ||
        String(materia.profesorId) === this.filtroProfesor();
      const coincideEstado = !this.filtroEstado() || materia.estado === this.filtroEstado();
      return coincideTexto && coincideCiclo && coincideGrado && coincideProfesor && coincideEstado;
    });
  });

  ngOnInit(): void {
    void this.cargarDatos();
  }

  protected async cargarDatos(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [materias, metricas, ciclos, grupos, profesores] = await Promise.all([
        this.api.obtenerMaterias(),
        this.api.obtenerMetricas(),
        this.api.obtenerCiclos(),
        this.api.obtenerGrupos(),
        this.api.obtenerProfesores(),
      ]);
      this.materias.set(materias);
      this.metricas.set(metricas);
      this.ciclos.set(ciclos);
      this.grupos.set(grupos);
      this.profesores.set(profesores);
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirCrear(): void {
    this.modalModo.set('crear');
    this.materiaSeleccionada.set(null);
    this.formulario.enable();
    this.formulario.reset({
      nombre: '', codigo: '', claveSep: '', cargaHoraria: '',
      cicloEscolarId: String(this.cicloActivo()?.id ?? this.ciclosConfigurables()[0]?.id ?? ''),
      grupoIds: [], profesorId: '', estado: 'Activa', isTroncoComun: false,
    });
    this.cicloFormulario.set(this.formulario.controls.cicloEscolarId.value);
    this.modalAbierto.set(true);
  }

  protected abrirEditar(materia: Materia): void {
    this.modalModo.set('editar');
    this.materiaSeleccionada.set(materia);
    this.precargarFormulario(materia);
    this.formulario.enable();
    this.formulario.controls.cicloEscolarId.disable();
    if (materia.cicloEscolar.estado === 'Activo') {
      this.formulario.controls.grupoIds.disable();
    }
    if (materia.cicloEscolar.estado === 'Finalizado') {
      this.formulario.disable();
    }
    this.modalAbierto.set(true);
  }

  protected abrirConsulta(materia: Materia): void {
    this.modalModo.set('consultar');
    this.materiaSeleccionada.set(materia);
    this.precargarFormulario(materia);
    this.formulario.disable();
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.materiaSeleccionada.set(null);
    this.formulario.enable();
  }

  protected cambiarCiclo(): void {
    this.cicloFormulario.set(this.formulario.controls.cicloEscolarId.value);
    this.formulario.controls.grupoIds.setValue([]);
  }

  protected cambiarGrupos(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const ids = [...select.selectedOptions].map((opcion) => Number(opcion.value));
    this.formulario.controls.grupoIds.setValue(ids);
    this.formulario.controls.grupoIds.markAsDirty();
  }

  protected async guardar(): Promise<void> {
    if (this.modalModo() === 'consultar' || this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const seleccionada = this.materiaSeleccionada();
    if (seleccionada?.cicloEscolar.estado === 'Finalizado') return;
    const valor = this.formulario.getRawValue();
    const payload: MateriaPayload = {
      nombre: valor.nombre.trim(),
      codigo: valor.codigo.trim(),
      claveSep: valor.claveSep.trim(),
      cargaHoraria: valor.cargaHoraria.trim(),
      grupoIds: valor.grupoIds,
      profesorId: valor.profesorId ? Number(valor.profesorId) : null,
      estado: valor.estado,
      isTroncoComun: valor.isTroncoComun,
    };
    this.guardando.set(true);
    this.error.set('');
    try {
      if (this.modalModo() === 'crear') {
        await this.api.crearMateria(payload);
        this.mensaje.set('Materia registrada correctamente.');
      } else if (seleccionada) {
        await this.api.actualizarMateria(seleccionada.id, payload);
        this.mensaje.set('Materia actualizada correctamente.');
      }
      this.cerrarModal();
      await this.cargarDatos();
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async darDeBaja(materia: Materia): Promise<void> {
    if (materia.estado === 'Inactiva' || materia.cicloEscolar.estado === 'Finalizado') return;
    this.error.set('');
    try {
      await this.api.darDeBaja(materia.id);
      this.mensaje.set('Materia dada de baja; sus relaciones académicas se conservaron.');
      await this.cargarDatos();
    } catch (error) {
      this.error.set(this.mensajeError(error));
    }
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroCiclo.set('');
    this.filtroGrado.set('');
    this.filtroProfesor.set('');
    this.filtroEstado.set('');
  }

  protected mostrarEstado(estado: EstadoMateria): string {
    return estado === 'En planeacion' ? 'En planeación' : estado;
  }

  protected letrasGrupos(materia: Materia): string {
    return materia.grupos.map((grupo) => grupo.grupoLetra).join(', ');
  }

  protected nombresGrados(materia: Materia): string {
    return materia.grados.map((grado) => grado.nombre).join(', ');
  }

  protected nombresGrupos(materia: Materia): string {
    return materia.grupos.map((grupo) => grupo.nombre).join(', ');
  }

  private precargarFormulario(materia: Materia): void {
    this.formulario.reset({
      nombre: materia.nombre,
      codigo: materia.codigo,
      claveSep: materia.claveSep,
      cargaHoraria: materia.cargaHoraria,
      cicloEscolarId: String(materia.cicloEscolar.id),
      grupoIds: [...materia.grupoIds],
      profesorId: materia.profesorId === null ? '' : String(materia.profesorId),
      estado: materia.estado,
      isTroncoComun: materia.isTroncoComun,
    });
    this.cicloFormulario.set(String(materia.cicloEscolar.id));
  }

  private mensajeError(error: unknown): string {
    if (error instanceof MateriasApiError) return error.message;
    return 'Ocurrió un error inesperado al gestionar las materias.';
  }
}
