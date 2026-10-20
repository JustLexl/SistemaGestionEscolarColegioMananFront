import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login-page').then((c) => c.LoginPage),
    title: 'Iniciar sesión | Colegio Manantial'
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell').then((c) => c.Shell),
    children: [
      {
        path: 'alumnos',
        loadComponent: () =>
          import('./pages/alumnos/alumnos.component').then((c) => c.AlumnosComponent),
        title: 'Alumnos | Colegio Manantial'
      },
      {
        path: 'grados-y-grupos',
        loadComponent: () =>
          import('./pages/grados-grupos/grados-grupos.component').then((c) => c.GradosGruposComponent),
        title: 'Grados y Grupos | Colegio Manantial'
      },
      {
        path: 'asistencias',
        loadComponent: () =>
          import('./pages/asistencias/asistencias.component').then((c) => c.AsistenciasComponent),
        title: 'Asistencias | Colegio Manantial'
      },
      {
        path: 'profesores',
        loadComponent: () =>
          import('./features/profesores/pages/profesores-page/profesores-page').then((c) => c.ProfesoresPage),
        title: 'Profesores | Colegio Manantial'
      },
      {
        path: 'calificaciones',
        loadComponent: () =>
          import('./features/calificaciones/pages/calificaciones-page/calificaciones-page').then((c) => c.CalificacionesPage),
        title: 'Calificaciones | Colegio Manantial'
      },
      { path: '', redirectTo: 'alumnos', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
