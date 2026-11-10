import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RolesApiError, RolesApiService } from './roles-api.service';

export type RolTipo = 'Administrativo' | 'Directivos' | 'Profesores';

export interface Rol {
  id: number;
  nombre: string;
  puesto: RolTipo;
  correo: string;
  estado: 'Activo' | 'Inactivo';
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent implements OnInit {
  constructor(
    private router: Router,
    private rolesApi: RolesApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  // Listado de roles / usuarios del sistema con roles definidos
  roles: Rol[] = [];

  // Filtros
  searchTerm: string = '';
  filterEstado: string = '';
  filterPuesto: string = '';

  // Paginación
  currentPage: number = 1;
  pageSize: number = 8;

  // Control de Modales
  isRolModalOpen: boolean = false;
  isDeleteModalOpen: boolean = false;
  isDetalleModalOpen: boolean = false;
  isNotificationsOpen: boolean = false;
  isProfileMenuOpen: boolean = false;

  // Roles oficiales del sistema (únicos permitidos)
  rolesDisponibles: RolTipo[] = ['Administrativo', 'Directivos', 'Profesores'];

  // Estado del formulario Rol (Crear / Editar)
  editingRolId: number | null = null;
  rolForm = {
    nombre: '',
    puesto: 'Profesores' as RolTipo,
    correo: '',
    cedula: '',
    estado: 'Activo' as 'Activo' | 'Inactivo'
  };

  // Rol seleccionado para eliminar o ver detalle
  selectedRolForDelete: Rol | null = null;
  selectedRolDetail: Rol | null = null;

  // Toast
  toastVisible: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'info' | 'warning' | 'error' = 'success';
  private toastTimeout: any;

  ngOnInit(): void {
    void this.cargarRoles();
  }

  private async cargarRoles(): Promise<void> {
    try {
      this.roles = [...await this.rolesApi.obtenerRoles()];
      this.cdr.markForCheck();
    } catch (error) {
      this.mostrarErrorApi(error);
    }
  }

  // ── Getters de filtrado y paginación ──────────────────────────────────────

  get puestoOptions(): RolTipo[] {
    return this.rolesDisponibles;
  }

  get filteredRoles(): Rol[] {
    return this.roles.filter(r => {
      const matchSearch = !this.searchTerm ||
        r.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.puesto.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.correo.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchEstado = !this.filterEstado || r.estado === this.filterEstado;
      const matchPuesto = !this.filterPuesto || r.puesto === this.filterPuesto;

      return matchSearch && matchEstado && matchPuesto;
    });
  }

  get paginatedRoles(): Rol[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRoles.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRoles.length / this.pageSize) || 1;
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get startIndex(): number { return (this.currentPage - 1) * this.pageSize; }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredRoles.length);
  }

  // KPIs
  get totalActivosCount(): number { return this.roles.filter(r => r.estado === 'Activo').length; }
  get totalInactivosCount(): number { return this.roles.filter(r => r.estado === 'Inactivo').length; }
  get totalRolesCount(): number { return this.roles.length; }

  // ── Paginación ─────────────────────────────────────────────────────────────

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }

  // ── Filtros ────────────────────────────────────────────────────────────────

  resetFilters(): void {
    this.searchTerm = '';
    this.filterEstado = '';
    this.filterPuesto = '';
    this.currentPage = 1;
    this.showToast('Filtros restablecidos correctamente', 'info');
  }

  onFilterChange(): void { this.currentPage = 1; }

  // ── Modal Crear / Editar ───────────────────────────────────────────────────

  openRolModal(rol?: Rol): void {
    if (rol) {
      this.editingRolId = rol.id;
      this.rolForm = {
        nombre: rol.nombre,
        puesto: rol.puesto,
        correo: rol.correo,
        cedula: '',
        estado: rol.estado,
      };
    } else {
      this.editingRolId = null;
      this.rolForm = {
        nombre: '',
        puesto: 'Profesores',
        correo: '',
        cedula: '',
        estado: 'Activo',
      };
    }
    this.isRolModalOpen = true;
  }

  closeRolModal(): void {
    this.isRolModalOpen = false;
    this.editingRolId = null;
    this.cdr.markForCheck();
  }

  onPuestoChange(puesto: RolTipo): void {
    this.rolForm.puesto = puesto;
    if (puesto !== 'Profesores') {
      this.rolForm.cedula = '';
    }
  }

  async saveRol(): Promise<void> {
    if (!this.rolForm.nombre.trim() || !this.rolForm.puesto.trim() || !this.rolForm.correo.trim()) {
      this.showToast('Complete todos los campos obligatorios', 'warning');
      return;
    }

    if (this.rolForm.puesto === 'Profesores' && !this.rolForm.cedula.trim()) {
      this.showToast('La cédula es obligatoria para el rol Profesores', 'warning');
      return;
    }

    const datos = {
      nombre: this.rolForm.nombre.trim(),
      puesto: this.rolForm.puesto,
      correo: this.rolForm.correo.trim(),
      estado: this.rolForm.estado,
      ...(this.rolForm.puesto === 'Profesores'
        ? { cedula: this.rolForm.cedula.trim() }
        : {}),
    };

    try {
      if (this.editingRolId !== null) {
        const resultado = await this.rolesApi.actualizarRol(this.editingRolId, datos);
        const idx = this.roles.findIndex(r => r.id === this.editingRolId);
        if (idx !== -1) {
          this.roles[idx] = resultado.usuario;
        }
        this.showToast(`Usuario "${resultado.usuario.nombre}" actualizado exitosamente`, 'success');
      } else {
        const resultado = await this.rolesApi.registrarRol(datos);
        this.roles.unshift(resultado.usuario);
        this.showToast(`Usuario "${resultado.usuario.nombre}" registrado exitosamente`, 'success');
      }
      this.closeRolModal();
    } catch (error) {
      this.mostrarErrorApi(error);
    }
  }

  // ── Modal Eliminar ─────────────────────────────────────────────────────────

  openDeleteModal(rol: Rol): void {
    this.selectedRolForDelete = rol;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedRolForDelete = null;
    this.cdr.markForCheck();
  }

  async confirmarEliminacion(): Promise<void> {
    if (this.selectedRolForDelete) {
      const usuario = this.selectedRolForDelete;
      try {
        await this.rolesApi.eliminarRol(usuario.id);
        this.roles = this.roles.filter(r => r.id !== usuario.id);
        this.showToast(`Usuario "${usuario.nombre}" eliminado del sistema`, 'warning');
        this.closeDeleteModal();
      } catch (error) {
        this.mostrarErrorApi(error);
      }
    }
  }

  // ── Modal Detalle ──────────────────────────────────────────────────────────

  openDetalleModal(rol: Rol): void {
    this.selectedRolDetail = rol;
    this.isDetalleModalOpen = true;
  }

  closeDetalleModal(): void {
    this.isDetalleModalOpen = false;
    this.selectedRolDetail = null;
  }

  // ── Toggle Estado rápido ───────────────────────────────────────────────────

  async toggleEstado(rol: Rol): Promise<void> {
    try {
      const resultado = await this.rolesApi.cambiarEstado(rol.id);
      const idx = this.roles.findIndex(item => item.id === rol.id);
      if (idx !== -1) {
        this.roles[idx] = resultado.usuario;
      }
      this.showToast(
        `Estado de "${resultado.usuario.nombre}" cambiado a ${resultado.usuario.estado}`,
        'info',
      );
    } catch (error) {
      this.mostrarErrorApi(error);
    }
  }

  // ── Iniciales del nombre ───────────────────────────────────────────────────

  getIniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(w => w.length > 2)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  // ── UI Header / Sidebar ────────────────────────────────────────────────────

  toggleNotifications(): void { this.isNotificationsOpen = !this.isNotificationsOpen; }
  toggleProfileMenu(): void { this.isProfileMenuOpen = !this.isProfileMenuOpen; }
  onLogout(): void { this.showToast('Cerrando sesión de usuario...', 'info'); }

  navigateTo(path: string): void {
    if (path === 'grados-y-grupos') {
      this.router.navigate(['/grados-y-grupos']);
    } else if (path === 'materias') {
      this.router.navigate(['/materias']);
    } else if (path === 'roles') {
      this.router.navigate(['/roles']);
    } else {
      this.showToast(`Navegando a la sección: ${path}`, 'info');
    }
  }

  // ── Toast ──────────────────────────────────────────────────────────────────

  showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success'): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.cdr.markForCheck();
    this.toastTimeout = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.markForCheck();
    }, 3500);
  }

  private mostrarErrorApi(error: unknown): void {
    const message = error instanceof RolesApiError
      ? error.message
      : 'Ocurrió un error inesperado al procesar el usuario.';
    this.showToast(message, 'error');
  }
}
