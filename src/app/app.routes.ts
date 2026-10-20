import { Routes } from '@angular/router';
<<<<<<< HEAD

export const routes: Routes = [];
=======
import { GradosGruposComponent } from './pages/grados-grupos/grados-grupos.component';

export const routes: Routes = [
  { path: '', redirectTo: 'grados-y-grupos', pathMatch: 'full' },
  { path: 'grados-y-grupos', component: GradosGruposComponent }
];

>>>>>>> origin/feature/CRUDGradosGrupos
