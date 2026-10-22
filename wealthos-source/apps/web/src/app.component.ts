import { Component, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradingChartComponent } from './trading-chart.component';
import {siteAuth,marketApi,SiteUser,AuthConfig,StockResponse,CryptoResponse} from './services/site-api';
import { balance, summarize, parseMoneyToCents, validateAmount, validateDate, assertNoDuplicate, Entry, stockPosition, sectorPerformance, StockQuote, Holding } from '@wealthos/finance';
interface Account { id:string; name:string; institution:string; color:string; openingBalanceCents:number; balanceCents?:number; }
interface Transaction extends Entry { description:string; category:string; idempotencyKey:string; }
interface Budget { id:string; category:string; limitCents:number; }
interface Goal { id:string; name:string; targetCents:number; savedCents:number; icon:string; }
interface State { accounts:Account[]; transactions:Transaction[]; budgets:Budget[]; goals:Goal[]; }
type View = 'dashboard'|'transactions'|'accounts'|'budgets'|'goals'|'stocks'|'profile';
@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule,TradingChartComponent],templateUrl:'./app.component.html'})
export class AppComponent {
  private readonly storageKey = 'wealthos:demo:v1';
  MathRound = Math.round;
  theme:'light'|'dark'=document.documentElement.dataset['theme']==='dark'?'dark':'light';
  stockTab:'market'|'portfolio'|'detail'|'indices'|'crypto'='market';
  stockPeriod:'day'|'month'|'year'='day';
  stockSearch=''; stockSector='ALL';
  quotes:StockQuote[]=[];
  holdings:Holding[]=[];
  holdingDraft={id:'',ticker:'',quantity:'',averagePrice:'',unknownCost:true};
  pendingDelete:Holding|null=null;
  readonly stockPeriods:{key:'day'|'month'|'year';label:string}[]=[{key:'day',label:'Dia'}];
  get sectors(){return [...new Set(this.sampleQuotes.map(q=>q.sector))].sort();}
  get periodLabel(){return this.stockPeriods.find(p=>p.key===this.stockPeriod)!.label;}
  get marketQuotes(){const term=this.stockSearch.trim().toLocaleLowerCase('pt-BR');return this.sampleQuotes.filter(q=>(this.stockSector==='ALL'||q.sector===this.stockSector)&&(!term||(q.ticker+' '+q.name).toLocaleLowerCase('pt-BR').includes(term))).sort((a,b)=>(b.changes[this.stockPeriod]??-Infinity)-(a.changes[this.stockPeriod]??-Infinity));}
  get marketLeaders(){return this.marketQuotes.filter(q=>q.priceCents!==null&&(q.changes[this.stockPeriod]??0)>0).slice(0,4);}
  get sectorRows(){return sectorPerformance(this.sampleQuotes.filter(q=>q.priceCents!==null),this.stockPeriod);}
  get positions(){return this.holdings.map(h=>({holding:h,quote:this.quotes.find(q=>q.ticker===h.ticker),...stockPosition(h,this.quotes.find(q=>q.ticker===h.ticker))}));}
  get portfolioMarketValue(){const valued=this.positions.filter(p=>p.marketValueCents!==null);return valued.length?this.safeTotal(valued.map(p=>p.marketValueCents!)):null;}
  get portfolioMissingQuotes(){return this.positions.filter(p=>p.marketValueCents===null).length;}
  get portfolioProfit(){const positions=this.positions;return positions.length&&positions.every(p=>p.profitCents!==null)?this.safeTotal(positions.map(p=>p.profitCents!)):null;}
  get portfolioCost(){const positions=this.positions;return positions.length&&positions.every(p=>p.costBasisCents!==null)?this.safeTotal(positions.map(p=>p.costBasisCents!)):null;}
  private safeTotal(values:number[]):number|null{let total=0;for(const value of values){total+=value;if(!Number.isSafeInteger(total))return null;}return total;}
  quoteChange(q:StockQuote){return q.changes[this.stockPeriod];}
  signedPercent(value:number|null){return value===null?'Indisponível':(value>0?'+':'')+new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)+'%';}
  optionalMoney(value:number|null){return value===null?'Indisponível':this.money(value);}
  toggleTheme(){this.theme=this.theme==='dark'?'light':'dark';document.documentElement.dataset['theme']=this.theme;try{localStorage.setItem('wealthos:theme',this.theme);}catch{}if(this.view==='profile')setTimeout(()=>void this.renderGoogle());}
  openHolding(holding?:Holding){if(!this.portfolioReady){this.notify('Carregue sua carteira antes de editar.');this.navigate('profile');return;}this.openModal('holding');this.holdingDraft=holding?{id:holding.id,ticker:holding.ticker,quantity:String(holding.quantity),averagePrice:holding.averagePriceCents===null?'':(holding.averagePriceCents/100).toFixed(2).replace('.',','),unknownCost:holding.averagePriceCents===null}:{id:'',ticker:'',quantity:'',averagePrice:'',unknownCost:true};}
  askDeleteHolding(holding:Holding){this.openModal('deleteHolding');this.pendingDelete=holding;}
  exportPortfolio(){const blob=new Blob([JSON.stringify({schemaVersion:1,quotes:'brapi-when-available',holdings:this.holdings},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='wealthos-minha-carteira.json';a.click();URL.revokeObjectURL(url);this.notify('Carteira exportada.');}
  private loadHoldings():Holding[]{try{const raw=localStorage.getItem('wealthos:holdings:v1');if(!raw)return [];const values:Holding[]=JSON.parse(raw);if(!Array.isArray(values))return [];const ids=new Set<string>(),tickers=new Set<string>();for(const h of values){if(typeof h.id!=='string'||!h.id||ids.has(h.id)||typeof h.ticker!=='string'||!/^[A-Z][A-Z0-9]{3}\d{1,2}F?$/.test(h.ticker)||tickers.has(h.ticker))return [];stockPosition(h);ids.add(h.id);tickers.add(h.ticker);}return values;}catch{return [];}}

  user:SiteUser|null=null;portfolioReady=true;
  authConfig:AuthConfig|null=null;
  authLoading=true;authBusy=false;authError='';userEmail='';userPassword='';userName='';userRegister=false;
  googleLoading=false;private googleScript:Promise<void>|null=null;
  legacyHoldings:Holding[]=this.loadHoldings();
  importedLocal=false;
  marketLoading=false;marketLoaded=false;marketError='';marketAsOf:string|null=null;
  marketResponses:Record<string,StockResponse>={};sampleResponses:Record<string,StockResponse>={};sampleQuotes:StockQuote[]=[];
  financeQuestion='';financeQuestionError='';
  selectedTicker='PETR4';chartRange='1mo';chartLoading=false;chartError='';stockDetail:StockResponse|null=null;
  cryptoLoading=false;cryptoLoaded=false;cryptoError='';cryptoData:CryptoResponse|null=null;
  selectedIndex='BMFBOVESPA:IBOV';selectedCrypto='BTC';
  readonly sandboxTickers=['PETR4','VALE3','ITUB4','MGLU3'];
  readonly indexOptions=[{symbol:'BMFBOVESPA:IBOV',name:'Ibovespa',currency:'BRL · pontos'},{symbol:'FRED:SP500',name:'S&P 500',currency:'FRED · série diária · pontos'}];
  readonly cryptoSymbols:Record<string,string>={BTC:'COINBASE:BTCUSD',ETH:'COINBASE:ETHUSD',SOL:'BINANCE:SOLUSDT',XRP:'BINANCE:XRPUSDT',ADA:'BINANCE:ADAUSDT',DOGE:'BINANCE:DOGEUSDT',BNB:'BINANCE:BNBUSDT',USDT:'KRAKEN:USDTUSD'};
  constructor(private zone:NgZone){void this.initializeAuth();}
  get availableQuotes(){return this.sampleQuotes.filter(q=>q.priceCents!==null);}
  get quoteTimestamp(){const dates=Object.values(this.sampleResponses).map(q=>q.asOf).filter((d):d is string=>!!d).sort();return dates[0]||null;}
  get chartPoints(){const rows=this.stockDetail?.history.filter(p=>Number.isFinite(p.close)&&p.close>0&&Number.isFinite(Date.parse(p.date)))||[];if(!rows.length)return [];return [...rows].sort((a,b)=>a.date.localeCompare(b.date));}
  get chartPath(){const rows=this.chartPoints;if(rows.length<2)return '';const min=Math.min(...rows.map(p=>p.close)),max=Math.max(...rows.map(p=>p.close));const span=max-min||1;return rows.map((p,i)=>(i?'L':'M')+(20+i/(rows.length-1)*760).toFixed(2)+' '+(220-(p.close-min)/span*180).toFixed(2)).join(' ');}
  get chartMin(){return this.chartPoints.length?Math.min(...this.chartPoints.map(p=>p.close)):null;}
  get chartMax(){return this.chartPoints.length?Math.max(...this.chartPoints.map(p=>p.close)):null;}
  get cryptoSymbol(){return this.cryptoSymbols[this.selectedCrypto]||'COINBASE:BTCUSD';}
  get cryptoChartCurrency(){return this.cryptoSymbol.includes('USDT')?'USDT':'USD';}
  get stockExternalSymbol(){return this.sandboxTickers.includes(this.selectedTicker)?'BMFBOVESPA:'+this.selectedTicker:null;}
  timestamp(value:string|null|undefined){if(!value)return 'Horário indisponível';const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(d):'Horário indisponível';}
  usdBrl(value:number|null){return value===null?'Indisponível':this.money(Math.round(value*100));}
  usd(value:number|null){return value===null?'Indisponível':this.hideValues?'••••••':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'USD',maximumFractionDigits:value<1?6:2}).format(value);}
  historyDate(value:string){const date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T12:00:00Z':value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeZone:'UTC'}).format(date):'Data indisponível';}
  async initializeAuth(){this.authLoading=true;this.authError='';try{const [config,session]=await Promise.all([siteAuth.config(),siteAuth.me()]);this.authConfig=config;if(session.user)await this.applyUser(session.user);}catch(e){this.authError=e instanceof Error?e.message:'Não foi possível verificar a sessão.';}finally{this.authLoading=false;if(this.view==='profile')setTimeout(()=>void this.renderGoogle());}}
  async applyUser(user:SiteUser){this.user=user;this.holdings=[];this.importedLocal=false;this.portfolioReady=false;try{const data=await siteAuth.portfolio();this.validateHoldings(data.holdings);this.holdings=data.holdings;this.portfolioReady=true;void this.loadPortfolioQuotes();}catch(e){this.authError=e instanceof Error?e.message:'Não foi possível carregar a carteira.';throw e;}}
  private validateHoldings(holdings:Holding[]){if(!Array.isArray(holdings))throw new Error('Resposta da carteira inválida.');const tickers=new Set<string>();for(const h of holdings){stockPosition(h);if(tickers.has(h.ticker))throw new Error('Ticker duplicado na carteira.');tickers.add(h.ticker);}}
  async submitUser(){if(this.authBusy)return;this.authBusy=true;this.authError='';try{const email=this.userEmail.trim();if(!email||!this.userPassword)throw new Error('Informe e-mail e senha.');const data=this.userRegister?await siteAuth.register(this.userName.trim(),email,this.userPassword):await siteAuth.login(email,this.userPassword);await this.applyUser(data.user);this.notify(this.userRegister?'Conta criada. Sua carteira está pronta.':'Bem-vindo! Sua carteira foi carregada.');}catch(e){this.authError=e instanceof Error?e.message:'Não foi possível entrar.';}finally{this.userPassword='';this.authBusy=false;}}
  async reloadUserPortfolio(){if(!this.user||this.authBusy)return;this.authBusy=true;this.authError='';try{await this.applyUser(this.user);}catch(e){this.authError=e instanceof Error?e.message:'Não foi possível carregar a carteira.';}finally{this.authBusy=false;}}
  async logoutUser(){if(this.authBusy)return;this.authBusy=true;this.authError='';try{await siteAuth.logout();this.user=null;this.holdings=[];this.importedLocal=false;this.portfolioReady=true;this.userPassword='';this.notify('Sessão encerrada.');}catch(e){this.authError=e instanceof Error?e.message:'Não foi possível sair.';}finally{this.authBusy=false;setTimeout(()=>void this.renderGoogle());}}
  async renderGoogle(){if(!this.authConfig?.googleClientId||this.user||this.view!=='profile')return;const element=document.getElementById('google-signin');if(!element)return;this.googleLoading=true;try{if(!this.googleScript)this.googleScript=new Promise<void>((resolve,reject)=>{const existing=(window as any).google?.accounts?.id;if(existing){resolve();return;}const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=()=>resolve();script.onerror=()=>reject(new Error('Não foi possível carregar o Google.'));document.head.append(script);});await this.googleScript;const google=(window as any).google?.accounts?.id;if(!google)throw new Error('Login Google indisponível.');google.initialize({client_id:this.authConfig.googleClientId,callback:(result:{credential:string})=>this.zone.run(()=>void this.signInGoogle(result.credential)),auto_select:false});element.replaceChildren();google.renderButton(element,{theme:this.theme==='dark'?'filled_black':'outline',size:'large',text:'continue_with',shape:'rectangular',width:300,locale:'pt-BR'});}catch(e){this.authError=e instanceof Error?e.message:'Google indisponível.';}finally{this.googleLoading=false;}}
  private async signInGoogle(credential:string){if(this.authBusy)return;this.authBusy=true;this.authError='';try{const data=await siteAuth.google(credential);await this.applyUser(data.user);this.notify('Conectado com sua conta Google.');}catch(e){this.authError=e instanceof Error?e.message:'Não foi possível entrar com Google.';}finally{this.authBusy=false;}}
  async importLocalPortfolio(){if(this.busy)return;this.busy=true;this.error='';try{const merged=[...this.holdings];for(const h of this.legacyHoldings){if(!merged.some(p=>p.ticker===h.ticker))merged.push(h);}await this.commitHoldings(merged);this.importedLocal=true;this.busy=false;this.closeModal();this.notify('Carteira local importada. Posições existentes foram preservadas.');await this.loadPortfolioQuotes();}catch(e){this.error=e instanceof Error?e.message:'Não foi possível importar.';}finally{this.busy=false;}}
  private async commitHoldings(next:Holding[]){if(!this.portfolioReady)throw new Error('Carregue sua carteira antes de editar.');this.validateHoldings(next);if(this.user){const saved=await siteAuth.savePortfolio(next);this.validateHoldings(saved.holdings);this.holdings=saved.holdings;}else{localStorage.setItem('wealthos:holdings:v1',JSON.stringify(next));this.holdings=next;this.legacyHoldings=next;this.importedLocal=true;}}
  async refreshMarket(){if(this.marketLoading)return;this.marketLoading=true;this.marketError='';let fails=0;for(const ticker of this.sandboxTickers){try{await this.fetchQuote(ticker,'1mo','brapi');}catch(e){fails++;this.marketError=e instanceof Error?e.message:'Cotações indisponíveis.';}}this.marketLoaded=true;this.marketLoading=false;if(fails===0)this.marketError='';}
  private async fetchQuote(ticker:string,range='1mo',provider:'google'|'brapi'='google'){
    const response=provider==='google'?await marketApi.googleFinance(ticker,range):await marketApi.stock(ticker,range);
    const quote:StockQuote={ticker:response.ticker,name:response.name||ticker,sector:({PETR4:'Petróleo e gás',VALE3:'Mineração',ITUB4:'Bancos',MGLU3:'Varejo',WEGE3:'Indústria',BBAS3:'Bancos'} as Record<string,string>)[ticker]||'Não classificado',priceCents:response.priceCents,changes:{day:response.changePercent,month:null,year:null}};
    if(provider==='brapi'){this.sampleResponses={...this.sampleResponses,[ticker]:response};this.sampleQuotes=[...this.sampleQuotes.filter(q=>q.ticker!==ticker),quote];}else{this.marketResponses={...this.marketResponses,[ticker]:response};this.quotes=[...this.quotes.filter(q=>q.ticker!==ticker),quote];}
    return response;
  }
  async loadPortfolioQuotes(){for(const h of this.holdings){if(this.marketResponses[h.ticker]?.source==='google-finance')continue;try{await this.fetchQuote(h.ticker);}catch{}}}
  async showStockChart(ticker:string){this.stockTab='detail';this.selectedTicker=ticker;await this.loadStockChart();}
  async loadStockChart(){if(this.chartLoading)return;this.selectedTicker=this.selectedTicker.trim().toUpperCase();this.stockDetail=null;if(!/^[A-Z][A-Z0-9]{3}\d{1,2}F?$/.test(this.selectedTicker)){this.chartError='Informe um ticker válido, como WEGE3 ou BBAS3.';return;}this.chartLoading=true;this.chartError='';try{this.stockDetail=await this.fetchQuote(this.selectedTicker,this.chartRange);this.chartError=this.stockDetail.error||'';}catch(e){this.chartError=e instanceof Error?e.message:'Não foi possível consultar o Google Finance.';}finally{this.chartLoading=false;}}
  async askFinance(){if(this.chartLoading)return;this.financeQuestionError='';const question=this.financeQuestion.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();const tickers=[...new Set(question.match(/\b[A-Z][A-Z0-9]{3}\d{1,2}F?\b/g)||[])];if(tickers.length>1){this.financeQuestionError='Consulte uma ação por vez. Exemplo: Como está WEGE3?';return;}let ticker=tickers[0];if(!ticker){const aliases=[{name:/\bPETROBRAS\b/,ticker:'PETR4'},{name:/\bVALE\b/,ticker:'VALE3'},{name:/\bWEG\b/,ticker:'WEGE3'},{name:/\bITAU\b/,ticker:'ITUB4'},{name:/\bBANCO DO BRASIL\b/,ticker:'BBAS3'}].filter(alias=>alias.name.test(question));if(aliases.length===1)ticker=aliases[0].ticker;}if(!ticker){this.financeQuestionError='Inclua o ticker na pergunta, como WEGE3, BBAS3 ou PETR4.';return;}this.selectedTicker=ticker;this.stockTab='detail';this.chartRange='1mo';await this.loadStockChart();}
  get googleFinanceUrl(){const ticker=this.stockDetail?.ticker||this.selectedTicker;return 'https://www.google.com/finance/quote/'+encodeURIComponent(/^[A-Z][A-Z0-9]{3}\d{1,2}F?$/.test(ticker)?ticker:'PETR4')+':BVMF?hl=pt-BR';}
  metricFigure(value:number|string|null|undefined,currency=false){if(value===null||value===undefined||value==='')return 'Indisponível';if(this.hideValues)return '••••••';if(typeof value==='string')return value;return new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:2,...(currency?{style:'currency',currency:'BRL'}:{})}).format(value);}
  async refreshCrypto(){if(this.cryptoLoading)return;this.cryptoLoading=true;this.cryptoError='';try{this.cryptoData=await marketApi.crypto();this.cryptoError=this.cryptoData.error||'';}catch(e){this.cryptoError=e instanceof Error?e.message:'Cotações de cripto indisponíveis.';this.cryptoData=null;}finally{this.cryptoLoaded=true;this.cryptoLoading=false;}}
  selectStockTab(tab:'market'|'portfolio'|'detail'|'indices'|'crypto'){this.stockTab=tab;if(tab==='market'&&!this.marketLoaded)void this.refreshMarket();if(tab==='portfolio')void this.loadPortfolioQuotes();if(tab==='detail'&&!this.stockDetail)void this.loadStockChart();if(tab==='crypto'&&!this.cryptoLoaded)void this.refreshCrypto();}

  view:View = 'dashboard';
  navigation:{key:View;label:string;icon:string}[]=[{key:'dashboard',label:'Visão geral',icon:'▦'},{key:'transactions',label:'Lançamentos',icon:'⇄'},{key:'accounts',label:'Minhas contas',icon:'▣'},{key:'budgets',label:'Orçamentos',icon:'◷'},{key:'goals',label:'Metas e sonhos',icon:'⚑'},{key:'stocks',label:'Ações e mercados',icon:'↗'},{key:'profile',label:'Minha conta',icon:'◎'}];
  categories=['Alimentação','Moradia','Transporte','Compras','Saúde','Lazer','Educação','Salário','Freelance','Outros'];
  private _month = this.localToday().slice(0,7);
  get month(){return this._month;}
  set month(value:string){if(/^\d{4}-(0[1-9]|1[0-2])$/.test(value)&&value>='2000-01'&&value<='2100-12')this._month=value;}
  search=''; filterType='ALL'; filterAccount='ALL'; hideValues=false; mobileMenu=false;
  state:State=this.load();
  modal:'transaction'|'account'|'budget'|'goal'|'progress'|'connection'|'holding'|'deleteHolding'|'stockAbout'|'importHoldings'|null=null;
  error=''; toast=''; busy=false; mode:'demo'|'api'='demo';

  draft={description:'',amount:'',type:'EXPENSE',category:'Alimentação',accountId:'',date:this.localToday(),name:'',institution:'',color:'#8052cb',opening:'0',target:'',saved:'0',goalId:''};
  private transactionKey = this.uuid();
  private returnFocus:HTMLElement|null=null;
  private toastTimer:ReturnType<typeof setTimeout>|undefined;
  get title(){return this.navigation.find(v=>v.key===this.view)!.label;}
  get summary(){return summarize(this.state.transactions,this.month);}
  get totalBalance(){return this.state.accounts.reduce((s,a)=>s+this.accountBalance(a),0);}
  get savingsRate(){return this.summary.incomeCents>0?Math.round((this.summary.incomeCents-this.summary.expenseCents)/this.summary.incomeCents*100):0;}
  get monthLabel(){return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(this.month+'-02T12:00:00Z'));}
  get filteredTransactions(){return this.state.transactions.filter(t=>t.date.startsWith(this.month)&&(this.filterType==='ALL'||t.type===this.filterType)&&(this.filterAccount==='ALL'||t.accountId===this.filterAccount)&&(!this.search||[t.description,t.category,this.accountName(t.accountId)].join(' ').toLocaleLowerCase('pt-BR').includes(this.search.toLocaleLowerCase('pt-BR')))).sort((a,b)=>b.date.localeCompare(a.date));}
  get recentTransactions(){return this.filteredTransactions.slice(0,5);}
  get expenseCategories(){const all=new Map<string,number>();for(const t of this.state.transactions){if(t.type==='EXPENSE'&&!t.reversedAt&&t.date.startsWith(this.month))all.set(t.category,(all.get(t.category)||0)+t.amountCents);}const sorted=[...all].map(([name,total])=>({name,total})).sort((a,b)=>b.total-a.total);return sorted.length>4?[...sorted.slice(0,3),{name:'Demais categorias',total:sorted.slice(3).reduce((sum,c)=>sum+c.total,0)}]:sorted;}
  get totalBudget(){return this.state.budgets.reduce((s,b)=>s+b.limitCents,0);}
  get graph(){const dates=Array.from({length:6},(_,i)=>{const d=new Date(this.month+'-02T12:00:00Z');d.setUTCMonth(d.getUTCMonth()-5+i);return d.toISOString().slice(0,7);});const vals=dates.filter(m=>m>='2000-01').map(m=>({month:m,...summarize(this.state.transactions,m)}));const max=Math.max(100000,...vals.flatMap(v=>[v.incomeCents,v.expenseCents]));return vals.map(v=>({...v,incomeHeight:Math.max(2,v.incomeCents/max*100),expenseHeight:Math.max(2,v.expenseCents/max*100),label:new Intl.DateTimeFormat('pt-BR',{month:'short',timeZone:'UTC'}).format(new Date(v.month+'-02T12:00:00Z')).replace('.','')}));}
  private uuid():string{if(typeof crypto.randomUUID==='function')return crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');}
  localToday(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);}
  money(value:number){return this.hideValues?'••••••':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value/100);}
  dateLabel(date:string){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));}
  accountName(id:string){return this.state.accounts.find(a=>a.id===id)?.name||'Conta indisponível';}
  accountBalance(a:Account){if(this.mode==='api'&&Number.isSafeInteger(a.balanceCents))return a.balanceCents!;return balance(a.openingBalanceCents,this.state.transactions.filter(t=>t.accountId===a.id));}
  spent(category:string){return this.state.transactions.filter(t=>t.type==='EXPENSE'&&t.category===category&&!t.reversedAt&&t.date.startsWith(this.month)).reduce((sum,t)=>sum+t.amountCents,0);}
  percent(value:number,total:number){return total>0?Math.min(100,Math.round(value/total*100)):0;}
  categoryIcon(c:string){return ({'Alimentação':'⌑','Moradia':'⌂','Transporte':'↗','Compras':'▢','Saúde':'♡','Lazer':'✦','Educação':'▤','Salário':'↓','Freelance':'⌘'} as Record<string,string>)[c]||'·';}
  navigate(v:View){this.view=v;this.mobileMenu=false;this.search='';this.filterType='ALL';this.filterAccount='ALL';if(v==='stocks'&&!this.marketLoaded)void this.refreshMarket();if(v==='profile')setTimeout(()=>void this.renderGoogle());}
  changeMonth(delta:number){const d=new Date(this.month+'-02T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+delta);this.month=d.toISOString().slice(0,7);}
  chooseMonth(){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(this.month))this.month=this.localToday().slice(0,7);}
  openModal(kind:NonNullable<AppComponent['modal']>,item?:Budget|Goal){
    this.returnFocus=document.activeElement as HTMLElement;this.modal=kind;this.error='';if(kind==='transaction')this.transactionKey=this.uuid();
    this.draft={description:'',amount:'',type:'EXPENSE',category:'Alimentação',accountId:this.state.accounts[0]?.id||'',date:this.localToday(),name:'',institution:'',color:'#8052cb',opening:'0',target:'',saved:'0',goalId:''};
    if(kind==='budget'&&item&&'category'in item){this.draft.category=item.category;this.draft.amount=(item.limitCents/100).toFixed(2).replace('.',',');}
    if(kind==='progress'&&item&&'savedCents'in item){this.draft.goalId=item.id;this.draft.name=item.name;}
    setTimeout(()=>(document.querySelector<HTMLElement>('.dialog input, .dialog select')||document.querySelector<HTMLElement>('.dialog button'))?.focus());
  }
  closeModal(){if(this.busy)return;this.modal=null;this.error='';this.returnFocus?.focus();}
  @HostListener('document:keydown',['$event']) onKey(event:KeyboardEvent){if(event.key==='Escape'){this.closeModal();this.mobileMenu=false;}if(event.key==='Tab'&&this.modal){const items=Array.from(document.querySelectorAll<HTMLElement>('.dialog button:not([disabled]),.dialog input,.dialog select')).filter(el=>el.offsetParent!==null);const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}
  notify(message:string){this.toast=message;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.toast='',4500);}
  private persist(){if(this.mode==='demo'){try{localStorage.setItem(this.storageKey,JSON.stringify(this.state));}catch{this.notify('Não foi possível salvar neste navegador. Exporte seus dados.');}}}
  async save(){if(this.busy)return;this.error='';this.busy=true;try{
    if(this.modal==='importHoldings'){this.busy=false;await this.importLocalPortfolio();return;}else if(this.modal==='holding'){
      const ticker=this.holdingDraft.ticker.trim().toUpperCase();if(!/^[A-Z][A-Z0-9]{3}\d{1,2}F?$/.test(ticker))throw new Error('Use um ticker brasileiro, como PETR4, TAEE11 ou PETR4F.');
      if(!/^\d+$/.test(this.holdingDraft.quantity.trim()))throw new Error('Informe uma quantidade inteira de ações.');
      const quantity=Number(this.holdingDraft.quantity);if(!Number.isSafeInteger(quantity)||quantity<1||quantity>1000000)throw new Error('A quantidade deve ser de 1 a 1.000.000 de ações.');
      const averagePriceCents=this.holdingDraft.unknownCost?null:parseMoneyToCents(this.holdingDraft.averagePrice);
      if(this.holdings.some(h=>h.ticker===ticker&&h.id!==this.holdingDraft.id))throw new Error('Este ticker já está na carteira. Edite a posição existente.');
      const holding:Holding={id:this.holdingDraft.id||this.uuid(),ticker,quantity,averagePriceCents};stockPosition(holding,this.quotes.find(q=>q.ticker===ticker));
      const next=this.holdingDraft.id?this.holdings.map(h=>h.id===holding.id?holding:h):[...this.holdings,holding];await this.commitHoldings(next);this.busy=false;this.closeModal();this.notify(this.user?'Posição sincronizada com sua conta.':'Posição salva neste navegador. Entre para sincronizar.');void this.loadPortfolioQuotes();return;
    }else if(this.modal==='deleteHolding'){
      await this.commitHoldings(this.holdings.filter(h=>h.id!==this.pendingDelete?.id));this.pendingDelete=null;this.busy=false;this.closeModal();this.notify('Posição removida da carteira.');return;
    }else if(this.modal==='transaction'){
      const cents=parseMoneyToCents(this.draft.amount);validateAmount(cents);validateDate(this.draft.date);
      if(!this.draft.description.trim())throw new Error('Informe uma descrição.');if(!this.state.accounts.some(a=>a.id===this.draft.accountId))throw new Error('Selecione uma conta.');
      const input={accountId:this.draft.accountId,description:this.draft.description.trim(),amountCents:cents,type:this.draft.type as 'INCOME'|'EXPENSE',category:this.draft.category,date:this.draft.date,idempotencyKey:this.transactionKey};
      const t:Transaction={id:this.uuid(),...input};this.state={...this.state,transactions:[...this.state.transactions.filter(item=>item.id!==t.id),t]};
    }else if(this.modal==='account'){
      if(!this.draft.name.trim()||!this.draft.institution.trim())throw new Error('Informe o nome e a instituição.');
      const negative=this.draft.opening.trim().startsWith('-');const openingBalanceCents=this.parseAllowZero(negative?this.draft.opening.trim().slice(1):this.draft.opening)*(negative?-1:1);
      if(Math.abs(openingBalanceCents)>1000000000)throw new Error('Saldo fora do limite permitido.');
      const input={name:this.draft.name.trim(),institution:this.draft.institution.trim(),color:this.draft.color,openingBalanceCents};const a:Account={id:this.uuid(),...input};this.state={...this.state,accounts:[...this.state.accounts,a]};
    }else if(this.modal==='budget'){
      const limitCents=parseMoneyToCents(this.draft.amount);validateAmount(limitCents);const existing=this.state.budgets.find(b=>b.category===this.draft.category);this.state={...this.state,budgets:existing?this.state.budgets.map(b=>b.id===existing.id?{...b,limitCents}:b):[...this.state.budgets,{id:this.uuid(),category:this.draft.category,limitCents}]};
    }else if(this.modal==='goal'){
      if(!this.draft.name.trim())throw new Error('Dê um nome à sua meta.');const targetCents=parseMoneyToCents(this.draft.target);validateAmount(targetCents);const savedCents=this.parseAllowZero(this.draft.saved);if(savedCents<0||savedCents>targetCents)throw new Error('O valor guardado deve estar entre zero e o valor da meta.');this.state={...this.state,goals:[...this.state.goals,{id:this.uuid(),name:this.draft.name.trim(),targetCents,savedCents,icon:'⚑'}]};
    }else if(this.modal==='progress'){
      const amount=parseMoneyToCents(this.draft.amount);validateAmount(amount);const g=this.state.goals.find(g=>g.id===this.draft.goalId)!;if(g.savedCents+amount>g.targetCents)throw new Error('O aporte ultrapassa o valor da meta.');this.state={...this.state,goals:this.state.goals.map(goal=>goal.id===g.id?{...goal,savedCents:goal.savedCents+amount}:goal)};
    }

    this.persist();this.busy=false;this.closeModal();this.notify('Tudo certo! Alteração salva.');
  }catch(error){this.error=error instanceof Error?error.message:'Não foi possível salvar. Tente novamente.';}finally{this.busy=false;}}
  async reverse(t:Transaction){if(t.reversedAt||this.busy)return;this.busy=true;try{const updated:Transaction={...t,reversedAt:new Date().toISOString()};this.state={...this.state,transactions:this.state.transactions.map(item=>item.id===t.id?updated:item)};this.persist();this.notify('Lançamento estornado. Saldo atualizado.');}catch(error){this.notify(error instanceof Error?error.message:'Não foi possível estornar.');}finally{this.busy=false;}}
  disconnect(){this.mode='demo';this.state=this.load();}
  exportData(){const data=JSON.stringify({exportedAt:new Date().toISOString(),mode:this.mode,...this.state},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='wealthos-'+this.mode+'-'+this.localToday()+'.json';a.click();URL.revokeObjectURL(url);this.notify('Exportação concluída.');}
  private parseAllowZero(input:string){return /^(?:0+)(?:,0{1,2})?$/.test(input.trim())?0:parseMoneyToCents(input);}
  private load():State{try{const raw=localStorage.getItem(this.storageKey);if(raw){const s=JSON.parse(raw) as State;if(!Array.isArray(s.accounts)||!Array.isArray(s.transactions)||!Array.isArray(s.goals)||!Array.isArray(s.budgets))throw new Error();for(const a of s.accounts){if(!a.id||!a.name||!Number.isSafeInteger(a.openingBalanceCents))throw new Error();}assertNoDuplicate(s.transactions);for(const t of s.transactions){validateAmount(t.amountCents);validateDate(t.date);if(!s.accounts.some(a=>a.id===t.accountId)||!['INCOME','EXPENSE'].includes(t.type))throw new Error();}for(const b of s.budgets)validateAmount(b.limitCents);for(const g of s.goals){validateAmount(g.targetCents);if(!Number.isSafeInteger(g.savedCents)||g.savedCents<0||g.savedCents>g.targetCents)throw new Error();}return s;}}catch{}return this.seed();}
  private seed():State{const month=this.localToday().slice(0,7);let index=0;const t=(description:string,amountCents:number,type:'INCOME'|'EXPENSE',category:string,day:number,accountId='nubank',m=month):Transaction=>({id:'demo-'+index++,accountId,description,amountCents,type,category,date:m+'-'+String(day).padStart(2,'0'),idempotencyKey:'seed-'+index});const transactions:Transaction[]=[t('Salário mensal',640000,'INCOME','Salário',5,'itau'),t('Projeto freelance',180000,'INCOME','Freelance',12),t('Aluguel do apartamento',185000,'EXPENSE','Moradia',7,'itau'),t('Supermercado',34280,'EXPENSE','Alimentação',18),t('Café com os amigos',4850,'EXPENSE','Lazer',19),t('Uber · volta para casa',3290,'EXPENSE','Transporte',20),t('Academia',12990,'EXPENSE','Saúde',10),t('Restaurante',8990,'EXPENSE','Alimentação',21),t('Livraria',7990,'EXPENSE','Educação',17),t('Internet',9990,'EXPENSE','Moradia',15,'itau'),t('Tênis de corrida',28990,'EXPENSE','Compras',16)];for(let i=1;i<6;i++){const d=new Date(month+'-02T12:00:00Z');d.setUTCMonth(d.getUTCMonth()-i);const m=d.toISOString().slice(0,7);transactions.push(t('Receitas do mês',640000+i*11000,'INCOME','Salário',5,'itau',m),t('Despesas do mês',370000+i*16000,'EXPENSE','Outros',15,'itau',m));}return{accounts:[{id:'nubank',name:'Conta principal',institution:'Nubank',color:'#8052cb',openingBalanceCents:520000},{id:'itau',name:'Conta do dia a dia',institution:'Itaú',color:'#ed7b3a',openingBalanceCents:315000},{id:'reserva',name:'Reserva de emergência',institution:'Banco Inter',color:'#2d9478',openingBalanceCents:890000}],transactions,budgets:[{id:'food',category:'Alimentação',limitCents:85000},{id:'home',category:'Moradia',limitCents:230000},{id:'transport',category:'Transporte',limitCents:40000},{id:'fun',category:'Lazer',limitCents:30000}],goals:[{id:'reserve',name:'Reserva de emergência',targetCents:2000000,savedCents:890000,icon:'◇'},{id:'travel',name:'Próxima viagem',targetCents:1000000,savedCents:325000,icon:'↗'},{id:'pc',name:'Meu novo computador',targetCents:700000,savedCents:420000,icon:'▣'}]};}
}
