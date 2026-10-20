import { Routes } from '@angular/router';
import { GradosGruposComponent } from './pages/grados-grupos/grados-grupos.component';
import { AlumnosComponent } from './pages/alumnos/alumnos.component';
import { AsistenciasComponent } from './pages/asistencias/asistencias.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login-page').then((component) => component.LoginPage),
    title: 'Iniciar sesión | Colegio Manantial'
  },
  {
    path: 'grados-y-grupos',
    component: GradosGruposComponent,
    title: 'Grados y Grupos | Colegio Manantial'
  },
  {
    path: 'alumnos',
    component: AlumnosComponent,
    title: 'Alumnos | Colegio Manantial'
  },
  {
    path: 'asistencias',
    component: AsistenciasComponent,
    title: 'Asistencias | Colegio Manantial'
  },
  {
    path: 'profesores',
    loadComponent: () =>
      import('./features/profesores/pages/profesores-page/profesores-page').then(
        (component) => component.ProfesoresPage
      ),
    title: 'Profesores | Colegio Manantial'
  },
  {
    path: 'calificaciones',
    loadComponent: () =>
      import('./features/calificaciones/pages/calificaciones-page/calificaciones-page').then(
        (component) => component.CalificacionesPage
      ),
    title: 'Calificaciones | Colegio Manantial'
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
