import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectFieldComponent } from './select-field.component';
import { TranslatePipe } from './i18n/translate.pipe';
import { readLanguagePreference, saveLanguagePreference, translate, type LanguagePreference } from './i18n/language';

@Component({
  selector: 'app-language-picker', standalone: true, imports: [FormsModule, SelectFieldComponent, TranslatePipe],
  template: `<div class="language-field"><span>{{'Idioma' | tr}}</span><app-select-field [ngModel]="preference" (ngModelChange)="change($event)" [disabled]="disabled" [options]="options" [ariaLabel]="'Idioma da aplicação' | tr" /></div>`,
  styles: [`:host{display:block;min-width:0}.language-field{display:grid;gap:7px}.language-field>span{font-size:12px;font-weight:600;color:var(--text-secondary)} app-select-field{min-width:0}`],
})
export class LanguagePickerComponent {
  @Input() disabled = false;
  readonly preference = readLanguagePreference();
  readonly options = [{ value: 'auto', label: translate('Automático (navegador)') }, { value: 'pt', label: 'Português' }, { value: 'en', label: 'English' }, { value: 'es', label: 'Español' }];
  change(value: string) {
    if (this.disabled || !['auto', 'pt', 'en', 'es'].includes(value) || value === this.preference) return;
    saveLanguagePreference(value as LanguagePreference);
    const url = new URL(window.location.href); url.searchParams.set('lang', value);
    window.location.assign(url.pathname + url.search + url.hash);
  }
}
