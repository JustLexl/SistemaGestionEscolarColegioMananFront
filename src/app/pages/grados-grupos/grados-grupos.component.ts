import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Grado,
  GradoPayload,
  GradosGruposApiError,
  GradosGruposApiService,
  Grupo,
  GrupoPayload,
  GruposMetricas,
  ProfesorResumen,
} from './grados-grupos-api.service';

@Component({
  selector: 'app-grados-grupos',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './grados-grupos.component.html',
  styleUrl: './grados-grupos.component.css',
})
export class GradosGruposComponent implements OnInit {
  private readonly api = inject(GradosGruposApiService);

  protected readonly grados = signal<readonly Grado[]>([]);
  protected readonly grupos = signal<readonly Grupo[]>([]);
  protected readonly profesores = signal<readonly ProfesorResumen[]>([]);
  protected readonly metricas = signal<GruposMetricas>({
    total: 0,
    activos: 0,
    gradosCount: 0,
    aulasCount: 0,
    matriculaTotal: 0,
    promedioAlumnos: 0,
  });
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');
  protected readonly modalGradoAbierto = signal(false);
  protected readonly modalGrupoAbierto = signal(false);
  protected readonly gradoEditandoId = signal<string | null>(null);
  protected readonly grupoEditandoId = signal<number | null>(null);
  protected readonly grupoCambioEstado = signal<Grupo | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtroGrado = signal('');
  protected readonly filtroTurno = signal('');
  protected readonly filtroEstado = signal('');

  protected readonly gruposFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase('es-MX');
    return this.grupos().filter((grupo) => {
      const coincideTexto =
        !texto ||
        [grupo.nombre, grupo.clave, grupo.aula, grupo.profesorNombre].some((valor) =>
          valor.toLocaleLowerCase('es-MX').includes(texto),
        );
      const coincideGrado = !this.filtroGrado() || grupo.gradoId === this.filtroGrado();
      const coincideTurno = !this.filtroTurno() || grupo.turno === this.filtroTurno();
      const coincideEstado = !this.filtroEstado() || grupo.estado === this.filtroEstado();
      return coincideTexto && coincideGrado && coincideTurno && coincideEstado;
    });
  });

  protected readonly formGrado = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nivel: new FormControl('Primaria', { nonNullable: true, validators: [Validators.required] }),
    ciclo: new FormControl('2026–2027', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly formGrupo = new FormGroup({
    gradoId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    grupoLetra: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9]{1,5}$/)],
    }),
    clave: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    aula: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    edificio: new FormControl('Edificio Principal', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    turno: new FormControl<'matutino' | 'vespertino'>('matutino', { nonNullable: true }),
    profesorId: new FormControl('', { nonNullable: true }),
    alumnosMax: new FormControl(40, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    estado: new FormControl<'Activo' | 'Inactivo'>('Activo', { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.cargarDatos();
  }

  protected async cargarDatos(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [grados, grupos, profesores, metricas] = await Promise.all([
        this.api.obtenerGrados(),
        this.api.obtenerGrupos(),
        this.api.obtenerProfesoresActivos(),
        this.api.obtenerMetricas(),
      ]);
      this.grados.set(grados);
      this.grupos.set(grupos);
      this.profesores.set(profesores);
      this.metricas.set(metricas);
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirCrearGrado(): void {
    this.gradoEditandoId.set(null);
    this.formGrado.reset({ nombre: '', nivel: 'Primaria', ciclo: '2026–2027' });
    this.error.set('');
    this.modalGradoAbierto.set(true);
  }

  protected abrirEditarGrado(grado: Grado): void {
    this.gradoEditandoId.set(grado.id);
    this.formGrado.setValue({
      nombre: grado.nombre,
      nivel: grado.nivel,
      ciclo: grado.ciclo,
    });
    this.error.set('');
    this.modalGradoAbierto.set(true);
  }

  protected cerrarGrado(): void {
    if (!this.guardando()) this.modalGradoAbierto.set(false);
  }

  protected async guardarGrado(): Promise<void> {
    if (this.formGrado.invalid || this.guardando()) {
      this.formGrado.markAllAsTouched();
      return;
    }

    const payload: GradoPayload = this.formGrado.getRawValue();
    const id = this.gradoEditandoId();
    this.guardando.set(true);
    this.error.set('');
    try {
      if (id) {
        await this.api.actualizarGrado(id, payload);
        this.mensaje.set('Grado actualizado correctamente.');
      } else {
        await this.api.crearGrado(payload);
        this.mensaje.set('Grado creado correctamente.');
      }
      this.modalGradoAbierto.set(false);
      await this.cargarDatos();
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected abrirCrearGrupo(): void {
    this.grupoEditandoId.set(null);
    this.formGrupo.reset({
      gradoId: this.grados()[0]?.id ?? '',
      grupoLetra: '',
      clave: '',
      aula: '',
      edificio: 'Edificio Principal',
      turno: 'matutino',
      profesorId: '',
      alumnosMax: 40,
      estado: 'Activo',
    });
    this.error.set('');
    this.modalGrupoAbierto.set(true);
  }

  protected abrirEditarGrupo(grupo: Grupo): void {
    this.grupoEditandoId.set(grupo.id);
    this.formGrupo.setValue({
      gradoId: grupo.gradoId,
      grupoLetra: grupo.grupoLetra,
      clave: grupo.clave,
      aula: grupo.aula,
      edificio: grupo.edificio,
      turno: grupo.turno,
      profesorId: grupo.profesorId === null ? '' : String(grupo.profesorId),
      alumnosMax: grupo.alumnosMax,
      estado: grupo.estado,
    });
    this.error.set('');
    this.modalGrupoAbierto.set(true);
  }

  protected cerrarGrupo(): void {
    if (!this.guardando()) this.modalGrupoAbierto.set(false);
  }

  protected async guardarGrupo(): Promise<void> {
    if (this.formGrupo.invalid || this.guardando()) {
      this.formGrupo.markAllAsTouched();
      return;
    }

    const valores = this.formGrupo.getRawValue();
    const payload: GrupoPayload = {
      ...valores,
      grupoLetra: valores.grupoLetra.trim().toUpperCase(),
      clave: valores.clave.trim().toUpperCase(),
      profesorId: valores.profesorId ? Number(valores.profesorId) : null,
    };
    const id = this.grupoEditandoId();
    this.guardando.set(true);
    this.error.set('');
    try {
      if (id !== null) {
        await this.api.actualizarGrupo(id, payload);
        this.mensaje.set('Grupo actualizado correctamente.');
      } else {
        await this.api.crearGrupo(payload);
        this.mensaje.set('Grupo registrado correctamente.');
      }
      this.modalGrupoAbierto.set(false);
      await this.cargarDatos();
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected solicitarCambioEstado(grupo: Grupo): void {
    this.grupoCambioEstado.set(grupo);
  }

  protected async confirmarCambioEstado(): Promise<void> {
    const grupo = this.grupoCambioEstado();
    if (!grupo || this.guardando()) return;

    this.guardando.set(true);
    this.error.set('');
    try {
      await this.api.cambiarEstadoGrupo(grupo.id);
      this.grupoCambioEstado.set(null);
      this.mensaje.set(`Estado de ${grupo.nombre} actualizado correctamente.`);
      await this.cargarDatos();
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroGrado.set('');
    this.filtroTurno.set('');
    this.filtroEstado.set('');
  }

  protected ocultarMensaje(): void {
    this.mensaje.set('');
  }

  protected porcentaje(grupo: Grupo): number {
    return grupo.alumnosMax > 0 ? Math.round((grupo.alumnosActuales / grupo.alumnosMax) * 100) : 0;
  }

  private mensajeError(error: unknown): string {
    if (error instanceof GradosGruposApiError) return error.message;
    return 'No fue posible completar la operación. Intenta nuevamente.';
  }
}
