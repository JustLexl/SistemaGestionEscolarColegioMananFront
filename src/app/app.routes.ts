
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
  { path: 'grados-y-grupos', component: GradosGruposComponent },
  { path: 'alumnos', component: AlumnosComponent },
  { path: 'asistencias', component: AsistenciasComponent },
  {
    path: 'profesores',
    loadComponent: () =>
      import('./features/profesores/pages/profesores-page/profesores-page').then(
        (component) => component.ProfesoresPage
      ),
    title: 'Profesores | Colegio Manantial'
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
