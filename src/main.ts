import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
<<<<<<< HEAD
import { App } from './app/app';

bootstrapApplication(App, appConfig)
=======
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
>>>>>>> origin/feature/CRUDGradosGrupos
  .catch((err) => console.error(err));
