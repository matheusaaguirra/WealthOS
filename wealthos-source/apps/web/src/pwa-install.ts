import { signal } from '@angular/core';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome:'accepted'|'dismissed'}>;
}
const pending = signal<InstallPrompt|null>(null);
export const pwaInstalled = signal(false);
export const pwaInstallReady = signal(false);
export const pwaInstallBusy = signal(false);
export const pwaInstallMessage = signal('');
let initialized=false;

export function initializePwa(){
  if(initialized||typeof window==='undefined')return;
  initialized=true;
  const mode=window.matchMedia('(display-mode: standalone)');
  const refresh=()=>pwaInstalled.set(mode.matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));
  refresh();mode.addEventListener('change',refresh);
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();pending.set(event as InstallPrompt);pwaInstallReady.set(true);pwaInstallMessage.set('');
  });
  window.addEventListener('appinstalled',()=>{
    pending.set(null);pwaInstallReady.set(false);pwaInstalled.set(true);pwaInstallMessage.set('');
  });
  if('serviceWorker' in navigator){
    void navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{
      // Browsing remains available if this browser does not allow service workers.
    });
  }
}

export async function installPwa(){
  const event=pending();if(!event||pwaInstallBusy())return;
  pending.set(null);pwaInstallReady.set(false);pwaInstallBusy.set(true);pwaInstallMessage.set('');
  try{
    await event.prompt();
    const choice=await event.userChoice;
    pwaInstallMessage.set(choice.outcome==='accepted'?'Instalação solicitada. Confirme as etapas exibidas pelo navegador.':'Instalação cancelada. Você pode instalar depois pelo menu do navegador.');
  }catch{pwaInstallMessage.set('Não foi possível abrir a instalação. Use o menu do navegador para instalar o app.');}
  finally{pwaInstallBusy.set(false);}
}
