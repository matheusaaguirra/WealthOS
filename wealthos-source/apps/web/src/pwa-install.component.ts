import { TranslatePipe } from './i18n/translate.pipe';
import { Component } from '@angular/core';
import { IconComponent } from './icon.component';
import { installPwa, pwaInstalled, pwaInstallReady, pwaInstallBusy, pwaInstallMessage } from './pwa-install';

@Component({
  selector:'app-pwa-install',standalone:true,imports:[TranslatePipe,IconComponent],
  template:`<section class="install-card" aria-labelledby="install-title">
    <div class="install-heading"><span class="install-logo"><app-icon name="logo"/></span><div><span class="install-kicker">{{ 'WEALTHOS NO SEU DISPOSITIVO' | tr }}</span><h2 id="install-title">{{ 'Seu controle, sempre à mão.' | tr }}</h2></div></div>
    @if(installed()){
      <p>{{ 'O app está instalado neste dispositivo. Abra pelo ícone do WealthOS na tela inicial ou na lista de aplicativos.' | tr }}</p>
      <span class="installed-status"><app-icon name="check"/> {{ 'App instalado' | tr }}</span>
    }@else{
      <p>{{ 'Instale o WealthOS para abrir suas finanças direto pela tela inicial, em uma janela própria.' | tr }}</p>
      @if(ready()||busy()){
        <button class="primary-button" type="button" (click)="install()" [disabled]="busy()"><app-icon name="download"/>  {{ (busy()?('Abrindo instalação…' | tr):('Instalar app' | tr)) | tr }}</button>
      }@else{
        <button class="secondary-button" type="button" (click)="showInstructions=!showInstructions" [attr.aria-expanded]="showInstructions" aria-controls="install-instructions"><app-icon name="download"/>  {{ (showInstructions?('Ocultar instruções' | tr):('Como instalar o app' | tr)) | tr }}</button>
      }
      @if(showInstructions){
        <div id="install-instructions" class="install-instructions">
          @if(ios){<strong>{{ 'No iPhone ou iPad' | tr }}</strong><p>{{ 'Abra este site no Safari. Toque em Compartilhar, escolha “Adicionar à Tela de Início” e confirme em “Adicionar”. Se aparecer, ative “Abrir como App da Web”.' | tr }}</p>}
          @else{<strong>{{ 'No celular' | tr }}</strong><p>{{ 'No Chrome ou Edge, abra o menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.' | tr }}</p><strong>{{ 'No computador' | tr }}</strong><p>{{ 'No Chrome ou Edge, use o ícone de instalação na barra de endereço ou a opção “Instalar WealthOS” no menu do navegador.' | tr }}</p>}
          <p class="install-note">{{ 'Se a opção não aparecer, abra o site diretamente no navegador, fora de aplicativos como Instagram ou WhatsApp.' | tr }}</p>
        </div>
      }
      <small>{{ 'Acesso e salvamento dos dados precisam de internet. Use a mesma conta do site.' | tr }}</small>
    }
    @if(message()){<p class="install-message" role="status">{{ (message()) | tr }}</p>}
  </section>`,
  styles:[`
    :host{display:block;min-width:0;margin-bottom:24px}.install-card{padding:25px;border:1px solid var(--border);border-radius:11px;background:var(--surface)}
    .install-heading{display:flex;align-items:center;gap:14px}.install-heading>div{min-width:0}.install-logo app-icon{width:48px;height:48px}.install-kicker{font-size:10px;letter-spacing:.09em;font-weight:700;color:var(--accent)}
    h2{font-size:21px;line-height:1.3;margin:5px 0 0;color:var(--ink)}p{font-size:13px;line-height:1.65;color:var(--text-secondary);margin:16px 0}
    button{display:inline-flex;align-items:center;justify-content:center;gap:8px;max-width:100%;padding:10px 17px}.installed-status{display:inline-flex;align-items:center;gap:8px;color:var(--positive);font-size:13px;font-weight:700}
    .install-instructions{margin-top:18px;padding:18px;border-radius:9px;background:var(--surface-subtle);border:1px solid var(--border)}.install-instructions strong{font-size:12px;color:var(--ink)}.install-instructions p{margin:6px 0 14px}.install-instructions p:last-child{margin-bottom:0}.install-instructions .install-note,small{font-size:12px;color:var(--text-secondary);line-height:1.6}small{display:block;margin-top:16px}.install-message{padding-top:14px;border-top:1px solid var(--border)}
    @media(max-width:700px){.install-card{padding:20px}.install-heading{align-items:flex-start}h2{font-size:19px}button{width:100%;min-height:48px}.install-instructions{padding:14px}}
  `]
})
export class PwaInstallComponent {
  readonly installed=pwaInstalled;readonly ready=pwaInstallReady;readonly busy=pwaInstallBusy;readonly message=pwaInstallMessage;
  readonly ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  showInstructions=false;
  install(){void installPwa();}
}
