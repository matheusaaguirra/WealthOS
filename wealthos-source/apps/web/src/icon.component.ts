import { Component, Input } from '@angular/core';

/** Small, decorative line icons. Labels belong to their adjacent control. */
@Component({
  selector: 'app-icon',
  standalone: true,
  host: { 'aria-hidden': 'true' },
  template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true"><path [attr.d]="path"/></svg>',
  styles: [':host{display:inline-flex;width:20px;height:20px;flex:0 0 auto;align-items:center;justify-content:center;vertical-align:middle}svg{display:block;width:100%;height:100%;overflow:visible}'],
})
export class IconComponent {
  @Input() name = 'circle';
  private readonly paths:Record<string,string> = {
    logo: 'M3 7l3 12 5-9 3 9 7-15 M15 4h6v6',
    dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    transactions: 'M4 7h16m-4-4 4 4-4 4 M20 17H4m4-4-4 4 4 4',
    accounts: 'M3 7a2 2 0 0 1 2-2h14v4H5a2 2 0 0 1 0-4 M3 7v12a2 2 0 0 0 2 2h16V9H5 M21 13h-5v4h5 M17 15h.01',
    budgets: 'M12 3v9h9 M8.5 3.7A9 9 0 1 0 20.3 15.5 M16 3.9a9 9 0 0 1 4.1 4.1',
    goals: 'M4 21V4m0 0c5-4 11 4 16 0v10c-5 4-11-4-16 0',
    stocks: 'M3 17l6-6 4 4 8-11 M15 4h6v6 M3 21h18',
    profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
    external: 'M7 17 17 7 M7 7h10v10',
    plus: 'M12 5v14 M5 12h14',
    close: 'm6 6 12 12 M18 6 6 18',
    search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
    menu: 'M4 6h16 M4 12h16 M4 18h16',
    check: 'm5 12 4 4L19 6',
    shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7z m-4 9 3 3 5-6',
    lock: 'M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4 M12 15v2',
    mail: 'M3 5h18v14H3z m0 1 9 7 9-7',
    eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    'eye-off': 'm3 3 18 18 M9.9 5.2A12 12 0 0 1 12 5c7 0 10 7 10 7a18 18 0 0 1-3.1 4.1 M6.1 6.1A19 19 0 0 0 2 12s3 7 10 7c1.6 0 3.1-.4 4.4-1 M10 10a3 3 0 0 0 4 4',
    moon: 'M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z',
    sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19',
    income: 'M18 5 6 17 M6 6v11h11',
    expense: 'M6 19 18 7 M7 7h11v11',
    download: 'M12 3v12m-5-5 5 5 5-5 M4 16v5h16v-5',
    refresh: 'M20 7V3l-4 4a8 8 0 0 0-13 6 M4 17v4l4-4a8 8 0 0 0 13-6 M16 7h4 M4 17h4',
    info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 11v6m0-10h.01',
    'chevron-left': 'm15 5-7 7 7 7',
    'chevron-right': 'm9 5 7 7-7 7',
    'chevron-down': 'm5 9 7 7 7-7',
    sparkles: 'm12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8Z',
    settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3m0 14v3M2 12h3m14 0h3 M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2',
    bank: 'm3 8 9-5 9 5H3 M5 11v7m7-7v7m7-7v7M3 21h18',
    food: 'M4 3v6a3 3 0 0 0 6 0V3 M7 3v18 M20 3c-4 3-4 8 0 9V3v18',
    home: 'm3 11 9-8 9 8 M5 10v11h14V10 M9 21v-7h6v7',
    car: 'm5 6-2 7v6h3v-3h12v3h3v-6l-2-7H5 M3 12h18 M7 14h.01M17 14h.01',
    bag: 'M4 7h16l-1 14H5L4 7 M8 7V5a4 4 0 0 1 8 0v2',
    heart: 'M12 21 3.5 12.5a5.3 5.3 0 0 1 8.5-6.3 5.3 5.3 0 0 1 8.5 6.3Z',
    book: 'M12 5v16 M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2',
    briefcase: 'M3 7h18v14H3z M8 7V3h8v4 M3 12l9 3 9-3 M10 13v4h4v-4',
    edit: 'm15 4 5 5 M3 21l5-1L21 7l-5-5L3 15v6',
    trash: 'M3 6h18 M5 6l1 15h12l1-15 M9 6V3h6v3 M10 10v7m4-7v7',
    logout: 'M9 3H3v18h6 M9 12h12m-5-5 5 5-5 5',
    circle: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  };
  private readonly aliases:Record<string,string> = {
    'Alimentação':'food','Moradia':'home','Transporte':'car','Compras':'bag','Saúde':'heart','Lazer':'sparkles','Educação':'book','Salário':'income','Freelance':'briefcase',
    '⚑':'goals','⌑':'food','⌂':'home','↗':'external','▢':'bag','♡':'heart','✦':'sparkles','▤':'book','↓':'income','⌘':'briefcase','·':'circle',
  };
  get path():string { return this.paths[this.aliases[this.name]||this.name]||this.paths['circle']; }
}
