import fs from 'node:fs/promises';
const topic = process.env.GROWTH_TOPIC || 'general';
const allowed = ['general','seo','content','acquisition','cro'];
if (!allowed.includes(topic)) throw new Error('Tema inválido');
if (!process.env.OPENAI_API_KEY) throw new Error('Configure OPENAI_API_KEY nos GitHub Actions Secrets');
const brief = JSON.parse(await fs.readFile(new URL('./brief.json', import.meta.url),'utf8'));
const instructions = await fs.readFile(new URL('./AGENT.md',import.meta.url),'utf8');
const payload = {
  model: 'gpt-4.1-mini',
  instructions: 'Você é o Growth AI. Siga as instruções recebidas. Responda em Markdown, em português brasileiro. Não afirme que inspecionou website ou analytics: você não tem ferramentas de navegação nem dados internos.',
  input: `${instructions}\n\nBrief: ${JSON.stringify(brief)}\n\nTema: ${topic}\nProduza plano de ações, hipóteses, prioridades, métricas, riscos e aprovações necessárias. Dados externos não foram fornecidos.`,
  max_output_tokens: 1800
};
const res = await fetch('https://api.openai.com/v1/responses',{
  method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
  body:JSON.stringify(payload)
});
if(!res.ok) throw new Error(`Falha na API de IA (HTTP ${res.status})`);
const data = await res.json();
const output = (data.output || []).flatMap(i => i.content || []).filter(c => c.type==='output_text').map(c => c.text).join('\n');
if(!output.trim()) throw new Error('A API não retornou texto');
await fs.mkdir('growth/output',{recursive:true});
await fs.writeFile('growth/output/report.md',`# Growth AI — Relatório ${topic}\n\nGerado: ${new Date().toISOString()}\n\n${output}\n`);
console.log('Relatório criado em growth/output/report.md');
