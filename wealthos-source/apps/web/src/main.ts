import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import { inject } from '@vercel/analytics';
import { AppComponent } from './app.component';
import { initializePwa } from './pwa-install';
initializePwa();
inject({
  mode:isDevMode()?'development':'production',
  beforeSend:event=>{
    const url=new URL(event.url);
    url.search='';url.hash='';
    return {...event,url:url.toString()};
  },
});
bootstrapApplication(AppComponent).catch(error => console.error('Falha ao iniciar WealthOS', error));
