import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  constructor(private router: Router) {}

  // Listado de roles / usuarios del sistema con roles definidos
  roles: Rol[] = [
    { id: 1, nombre: 'Prof. Javier Méndez',        puesto: 'Directivos',     correo: 'javier.mendez@manantial.edu.mx',    estado: 'Activo'   },
    { id: 2, nombre: 'Profra. Carmen Salinas',      puesto: 'Directivos',     correo: 'carmen.salinas@manantial.edu.mx',   estado: 'Activo'   },
    { id: 3, nombre: 'Prof. Roberto Carlos Valdés', puesto: 'Profesores',     correo: 'roberto.valdes@manantial.edu.mx',   estado: 'Activo'   },
    { id: 4, nombre: 'Profra. Elena Garro',         puesto: 'Profesores',     correo: 'elena.garro@manantial.edu.mx',      estado: 'Activo'   },
    { id: 5, nombre: 'Profra. Gabriela Mistral',    puesto: 'Profesores',     correo: 'gabriela.mistral@manantial.edu.mx', estado: 'Activo'   },
    { id: 6, nombre: 'Prof. Alfonso Reyes',         puesto: 'Profesores',     correo: 'alfonso.reyes@manantial.edu.mx',    estado: 'Activo'   },
    { id: 7, nombre: 'Profra. Sofía Ramírez',       puesto: 'Profesores',     correo: 'sofia.ramirez@manantial.edu.mx',    estado: 'Inactivo' },
    { id: 8, nombre: 'Prof. Miguel Ángel Torres',   puesto: 'Profesores',     correo: 'miguel.torres@manantial.edu.mx',    estado: 'Activo'   },
    { id: 9, nombre: 'Lic. Patricia Vega',          puesto: 'Administrativo', correo: 'patricia.vega@manantial.edu.mx',    estado: 'Activo'   },
    { id: 10, nombre: 'Lic. Jorge Hernández',       puesto: 'Administrativo', correo: 'jorge.hernandez@manantial.edu.mx',  estado: 'Inactivo' },
    { id: 11, nombre: 'Psic. Ana Lucía Morales',    puesto: 'Administrativo', correo: 'ana.morales@manantial.edu.mx',      estado: 'Activo'   },
    { id: 12, nombre: 'Ing. Carlos Fuentes',        puesto: 'Administrativo', correo: 'carlos.fuentes@manantial.edu.mx',   estado: 'Activo'   },
  ];

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

  ngOnInit(): void {}

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
      this.rolForm = { nombre: rol.nombre, puesto: rol.puesto, correo: rol.correo, estado: rol.estado };
    } else {
      this.editingRolId = null;
      this.rolForm = { nombre: '', puesto: 'Profesores', correo: '', estado: 'Activo' };
    }
    this.isRolModalOpen = true;
  }

  closeRolModal(): void {
    this.isRolModalOpen = false;
    this.editingRolId = null;
  }

  saveRol(): void {
    if (!this.rolForm.nombre.trim() || !this.rolForm.puesto.trim() || !this.rolForm.correo.trim()) {
      this.showToast('Complete todos los campos obligatorios', 'warning');
      return;
    }

    if (this.editingRolId !== null) {
      const idx = this.roles.findIndex(r => r.id === this.editingRolId);
      if (idx !== -1) {
        this.roles[idx] = { ...this.roles[idx], ...this.rolForm };
        this.showToast(`Usuario "${this.rolForm.nombre}" actualizado exitosamente`, 'success');
      }
    } else {
      const nextId = Math.max(...this.roles.map(r => r.id), 0) + 1;
      this.roles.unshift({ id: nextId, ...this.rolForm });
      this.showToast(`Usuario "${this.rolForm.nombre}" registrado exitosamente`, 'success');
    }
    this.closeRolModal();
  }

  // ── Modal Eliminar ─────────────────────────────────────────────────────────

  openDeleteModal(rol: Rol): void {
    this.selectedRolForDelete = rol;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedRolForDelete = null;
  }

  confirmarEliminacion(): void {
    if (this.selectedRolForDelete) {
      this.roles = this.roles.filter(r => r.id !== this.selectedRolForDelete!.id);
      this.showToast(`Usuario "${this.selectedRolForDelete.nombre}" eliminado del sistema`, 'warning');
    }
    this.closeDeleteModal();
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

  toggleEstado(rol: Rol): void {
    rol.estado = rol.estado === 'Activo' ? 'Inactivo' : 'Activo';
    this.showToast(`Estado de "${rol.nombre}" cambiado a ${rol.estado}`, 'info');
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
    this.toastTimeout = setTimeout(() => { this.toastVisible = false; }, 3500);
  }
}
