import { Routes } from '@angular/router';
import { GradosGruposComponent } from './pages/grados-grupos/grados-grupos.component';
import { AlumnosComponent } from './pages/alumnos/alumnos.component';

export const routes: Routes = [
  { path: '', redirectTo: 'grados-y-grupos', pathMatch: 'full' },
  { path: 'grados-y-grupos', component: GradosGruposComponent },
  { path: 'alumnos', component: AlumnosComponent }
];