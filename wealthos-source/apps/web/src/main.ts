import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { initializePwa } from './pwa-install';
initializePwa();
bootstrapApplication(AppComponent).catch(error => console.error('Falha ao iniciar WealthOS', error));
