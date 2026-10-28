export type InternationalLocale = 'en' | 'es';
type Copy = {
  title: string; description: string; ogLocale: string; skip: string; navigation: string; languages: string; featuresLink: string; questionsLink: string; login: string;
  eyebrow: string; hero: [string, string, string]; intro: string; cta: string; helper: string; availability: string;
  notebookLabel: string; notebookEyebrow: string; notebookTitle: [string, string]; accounts: [string, string, string][]; notebookNote: string;
  featuresEyebrow: string; featuresTitle: [string, string]; features: { index: string; title: string; body: string; items?: string[]; note?: string }[];
  stepsEyebrow: string; stepsTitle: [string, string]; stepsLink: string; steps: [string, string][];
  questionsEyebrow: string; questionsTitle: string; questions: [string, string][]; footer: string; footerLink: string; socialFeatures: string;
};

export const internationalCopy: Record<InternationalLocale, Copy> = {
  en: {
    title: 'WealthOS — Personal finance and investment tracking',
    description: 'Track income, expenses, recurring bills and investments with WealthOS. Keep everyday funds separate from benefits and savings. App available in Brazilian Portuguese.',
    ogLocale: 'en_US', skip: 'Skip to content', navigation: 'Main navigation', languages: 'Choose language', featuresLink: 'What you can do', questionsLink: 'Questions', login: 'Log in',
    eyebrow: 'PERSONAL FINANCE, IN ONE PLACE', hero: ['Your money,', 'with more ', 'clarity.'],
    intro: 'Understand what comes in, what goes out and what stays. Organize accounts, recurring expenses and investments with WealthOS, on your phone or computer.', cta: 'Organize my finances', helper: 'Sign in with Google or create an account with email.', availability: 'App interface in Brazilian Portuguese. Amounts are shown in Brazilian reais (BRL).',
    notebookLabel: 'How to organize your accounts in WealthOS', notebookEyebrow: 'YOUR FINANCIAL WORKSPACE', notebookTitle: ['Every account.', 'In its place.'], accounts: [['Everyday wallet', 'Money for your daily routine', 'Available'], ['Meal allowance', 'Keep food spending separate', 'Separate'], ['Savings and investments', 'What you are building for later', 'Separate']], notebookNote: 'You decide which accounts count toward your main balance.',
    featuresEyebrow: 'FROM EACH ENTRY TO THE BIG PICTURE', featuresTitle: ['A financial routine', 'that works for you.'],
    features: [
      { index: '01 / ORGANIZE', title: 'Know where your money goes.', body: 'Record income and expenses by category and account. Review a month, filter transactions and follow money in and out to understand your habits.', items: ['Categorized transactions', 'Accounts with separate balances', 'Recurring monthly expenses'] },
      { index: '02 / TRACK', title: 'Keep an eye on what comes next.', body: 'Bring your holdings together and follow prices, changes and charts. Explore Brazilian stocks, real estate funds (FIIs), fixed income, indices and cryptocurrencies.', note: 'Quotes may be delayed. Information is provided for tracking purposes and is not investment advice.' },
      { index: '03 / REVIEW', title: 'Your records, within reach.', body: 'Use WealthOS on your phone or computer. Import supported PDF statements, review entries and export an organized report of income and spending.', items: ['Financial reports in PDF', 'Records linked to your account', 'Install as a web app (PWA)'] },
    ],
    stepsEyebrow: 'START WITH THE ESSENTIALS', stepsTitle: ['Your first step', 'can be a small one.'], stepsLink: 'Open WealthOS', steps: [['Create your account', 'Sign in with Google or register with email.'], ['Add your main account', 'Enter an opening balance and separate benefits and savings if needed.'], ['Record your first transaction', 'Choose a category and an account. Your history starts here.']],
    questionsEyebrow: 'BEFORE YOU START', questionsTitle: 'Common questions.',
    questions: [
      ['What is WealthOS?', 'WealthOS is a personal finance workspace for recording income and expenses, organizing accounts, setting up recurring bills and tracking an investment portfolio.'],
      ['Which language and currency does the app use?', 'The app interface is currently in Brazilian Portuguese and financial amounts are displayed in Brazilian reais (BRL). This page introduces the product in English. Investment coverage includes Brazilian assets and cryptocurrencies; it does not imply support for every international market.'],
      ['Can I keep benefits and savings separate?', 'Yes. Choose which accounts contribute to your main wallet balance and which remain separate. You can still record spending against a separate account, such as a meal allowance.'],
      ['Does it connect to my bank automatically?', 'Transactions are entered by you or imported from a supported PDF statement. Review imported data before confirming entries. You do not need to provide your bank password. Compatibility with every bank or statement format is not guaranteed.'],
      ['Can I use it on my phone and export my records?', 'Yes. Use your mobile browser or install the web app through Minha conta (My account). You can export PDF reports with income, expenses, categories and accounts. An internet connection is required to access your records.'],
    ],
    footer: 'Clarity for your everyday finances.', footerLink: 'Log in to my account', socialFeatures: 'Accounts · Recurring expenses · Investments',
  },
  es: {
    title: 'WealthOS — Control de finanzas personales e inversiones',
    description: 'Organiza ingresos, gastos, pagos fijos e inversiones con WealthOS. Separa el saldo diario de tus beneficios y ahorros. Aplicación disponible en portugués de Brasil.',
    ogLocale: 'es_ES', skip: 'Saltar al contenido', navigation: 'Navegación principal', languages: 'Elegir idioma', featuresLink: 'Qué puedes hacer', questionsLink: 'Preguntas', login: 'Entrar',
    eyebrow: 'TUS FINANZAS PERSONALES, EN UN SOLO LUGAR', hero: ['Tu dinero,', 'con más ', 'claridad.'],
    intro: 'Entiende qué entra, qué sale y qué queda. Organiza cuentas, gastos fijos e inversiones con WealthOS, desde el móvil o el ordenador.', cta: 'Organizar mis finanzas', helper: 'Accede con Google o crea una cuenta con tu correo.', availability: 'Interfaz de la aplicación en portugués de Brasil. Importes en reales brasileños (BRL).',
    notebookLabel: 'Cómo organizar tus cuentas en WealthOS', notebookEyebrow: 'TU ESPACIO FINANCIERO', notebookTitle: ['Cada cuenta.', 'En su lugar.'], accounts: [['Saldo principal', 'El dinero para el día a día', 'Disponible'], ['Vale de alimentación', 'Tus gastos de comida, separados', 'Separado'], ['Ahorros e inversiones', 'Lo que estás construyendo', 'Separado']], notebookNote: 'Tú decides qué cuentas forman parte del saldo principal.',
    featuresEyebrow: 'DE CADA REGISTRO A LA VISIÓN COMPLETA', featuresTitle: ['Una rutina financiera', 'que tenga sentido para ti.'],
    features: [
      { index: '01 / ORGANIZAR', title: 'Descubre adónde va tu dinero.', body: 'Registra ingresos y gastos por categoría y cuenta. Consulta el mes, filtra movimientos y sigue las entradas y salidas para entender tus hábitos.', items: ['Movimientos por categoría', 'Cuentas con saldos separados', 'Gastos fijos mensuales'] },
      { index: '02 / SEGUIR', title: 'Mira también hacia el futuro.', body: 'Reúne tus activos y consulta cotizaciones, variaciones y gráficos. Explora acciones brasileñas, fondos inmobiliarios (FII), renta fija, índices y criptomonedas.', note: 'Las cotizaciones pueden tener retraso. La información sirve para el seguimiento y no constituye una recomendación de inversión.' },
      { index: '03 / CONSULTAR', title: 'Tus registros, al alcance de la mano.', body: 'Usa WealthOS en el móvil o en el ordenador. Importa extractos PDF compatibles, revisa los movimientos y exporta un informe organizado de tus ingresos y gastos.', items: ['Informes financieros en PDF', 'Historial asociado a tu cuenta', 'Instalación como aplicación web (PWA)'] },
    ],
    stepsEyebrow: 'EMPIEZA POR LO ESENCIAL', stepsTitle: ['Tu primer paso', 'puede ser pequeño.'], stepsLink: 'Acceder a WealthOS', steps: [['Crea tu cuenta', 'Accede con Google o regístrate con tu correo.'], ['Añade tu cuenta principal', 'Indica el saldo inicial y separa beneficios y ahorros si lo necesitas.'], ['Registra tu primer movimiento', 'Elige la categoría y la cuenta. Tu historial empieza aquí.']],
    questionsEyebrow: 'ANTES DE EMPEZAR', questionsTitle: 'Preguntas frecuentes.',
    questions: [
      ['¿Qué es WealthOS?', 'Es un sistema de finanzas personales para registrar ingresos y gastos, organizar cuentas, configurar pagos fijos y seguir tu cartera de inversiones en un solo lugar.'],
      ['¿En qué idioma y moneda funciona la aplicación?', 'La interfaz está actualmente en portugués de Brasil y los importes se muestran en reales brasileños (BRL). Esta página presenta el producto en español. La cobertura de inversiones incluye activos brasileños y criptomonedas, sin implicar compatibilidad con todos los mercados internacionales.'],
      ['¿Puedo mantener separados mis beneficios y ahorros?', 'Sí. Tú eliges qué cuentas forman parte del saldo principal y cuáles tienen un saldo separado. También puedes registrar gastos desde una cuenta separada, como un vale de alimentación.'],
      ['¿Importa mis gastos bancarios automáticamente?', 'Los registros se introducen manualmente o mediante un extracto PDF compatible. Revisa los datos importados antes de confirmar los movimientos. No necesitas proporcionar tu contraseña bancaria. No se garantiza compatibilidad con todos los bancos o formatos de extracto.'],
      ['¿Puedo usarlo en el móvil y descargar mis datos?', 'Sí. Accede desde el navegador o instala la aplicación web en Minha conta (Mi cuenta). Puedes exportar informes PDF con ingresos, gastos, categorías y cuentas. Necesitas conexión a internet para consultar tus registros.'],
    ],
    footer: 'Claridad para cuidar de tu dinero.', footerLink: 'Entrar en mi cuenta', socialFeatures: 'Cuentas · Gastos fijos · Inversiones',
  },
};
