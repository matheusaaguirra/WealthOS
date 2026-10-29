import fs from 'node:fs/promises';

const topic = process.env.GROWTH_TOPIC || 'general';
const templates = {
  general: {
    title: 'Plano geral de crescimento B2C',
    tasks: ['Definir a promessa principal da landing page em uma frase.', 'Publicar uma explicação prática do produto e seu benefício.', 'Revisar o caminho entre landing page e cadastro.', 'Configurar métricas agregadas de visita, cadastro e ativação.'],
    experiment: 'Comparar duas propostas de valor na página inicial, sem afirmar resultado antes de medir.',
    metric: 'Cadastros qualificados por visitante'
  },
  seo: {
    title: 'Checklist SEO',
    tasks: ['Verificar indexabilidade, robots.txt e sitemap.xml.', 'Revisar títulos e descrições das páginas públicas.', 'Identificar intenções de busca para controle financeiro pessoal.', 'Verificar conteúdo e hreflang para idiomas disponíveis.'],
    experiment: 'Criar uma página educativa de alta intenção e acompanhar impressões e cliques no Search Console.',
    metric: 'Cliques orgânicos e cadastros orgânicos'
  },
  content: {
    title: 'Conteúdo orgânico',
    tasks: ['Preparar um post educativo sobre organização de despesas.', 'Preparar demonstração visual das funcionalidades existentes.', 'Escrever chamada para cadastro sem prometer resultados financeiros.', 'Adaptar linguagem do conteúdo ao mercado e idioma.'],
    experiment: 'Comparar post demonstrativo e post educativo com links rastreáveis.',
    metric: 'Visitas qualificadas provenientes do conteúdo'
  },
  acquisition: {
    title: 'Aquisição orgânica B2C',
    tasks: ['Selecionar comunidades que permitam divulgação de ferramentas.', 'Planejar participação útil sem spam ou mensagens em massa.', 'Preparar página explicativa para cada público prioritário.', 'Criar parâmetros UTM para medir canais.'],
    experiment: 'Comparar visitas qualificadas de dois canais orgânicos autorizados.',
    metric: 'Cadastros qualificados por canal'
  },
  cro: {
    title: 'Otimização de conversão',
    tasks: ['Revisar clareza do CTA principal.', 'Verificar etapas do cadastro e erros de autenticação.', 'Revisar responsividade em dispositivos móveis.', 'Definir o evento de ativação após o primeiro acesso.'],
    experiment: 'Testar uma única alteração de CTA por vez e comparar conversão.',
    metric: 'Taxa de cadastro e ativação'
  }
};
if (!Object.hasOwn(templates, topic)) throw new Error('Tema inválido');
const brief = JSON.parse(await fs.readFile(new URL('./brief.json', import.meta.url), 'utf8'));
const plan = templates[topic];
const checklist = plan.tasks.map(t => '- [ ] ' + t).join('\n');
const content = [
  '# WealthOS Growth — ' + plan.title,
  '',
  'Gerado em: ' + new Date().toISOString(),
  'Site: ' + brief.website,
  'Público: ' + brief.audience,
  'Mercados: ' + brief.markets.join(', '),
  '',
  '## Próximas ações (sugestões, ainda não executadas)',
  checklist,
  '',
  '## Experimento proposto',
  plan.experiment,
  '',
  '## Métrica principal',
  plan.metric,
  '',
  '## Aprovação necessária',
  'Toda publicação, alteração de site, mensagem externa e gasto exige aprovação do fundador.',
  '',
  '## Limitações',
  'Relatório gerado por regras e modelos predefinidos, não por IA generativa.',
  'Não houve consulta a dados reais de Analytics, Search Console nem pesquisa ao vivo.',
  'Sem API externa, sem cobrança por tokens, sem publicações automáticas.'
].join('\n');
await fs.mkdir('growth/output', { recursive: true });
await fs.writeFile('growth/output/report.md', content + '\n');
console.log('Relatório gratuito gerado em growth/output/report.md');
