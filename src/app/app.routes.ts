
import { Routes } from '@angular/router';
import { GradosGruposComponent } from './pages/grados-grupos/grados-grupos.component';
import { AlumnosComponent } from './pages/alumnos/alumnos.component';
import { AsistenciasComponent } from './pages/asistencias/asistencias.component';

export const routes: Routes = [
  { path: '', redirectTo: 'grados-y-grupos', pathMatch: 'full' },
  { path: 'grados-y-grupos', component: GradosGruposComponent },
  { path: 'alumnos', component: AlumnosComponent },
  { path: 'asistencias', component: AsistenciasComponent }
];
