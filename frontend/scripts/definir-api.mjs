// Antes do build no Render: aponta o site para o endereco da API.
// API_URL vem do Render (ex.: linka-api-ypbn ou linka-api.onrender.com). Sem ela, fica '/api'
// (site e API no mesmo endereco, como no docker-compose).
import { readFileSync, writeFileSync } from 'node:fs';

const bruto = (process.env.API_URL ?? '').trim().replace(/\/$/, '');
if (!bruto) {
  console.log("API_URL vazia: o site continua chamando '/api'.");
  process.exit(0);
}
// O Render manda so o nome do servico (ex.: linka-api-ypbn): completa o dominio.
const host = bruto.includes('.') ? bruto : `${bruto}.onrender.com`;
const url = /^https?:\/\//.test(host) ? host : `https://${host}`;
const arquivo = new URL('../src/environments/environment.ts', import.meta.url);
const texto = readFileSync(arquivo, 'utf8');
const novo = texto.replace(/apiUrl: '[^']*'/, `apiUrl: '${url}'`);
if (novo === texto) throw new Error('apiUrl nao encontrado em environment.ts');
writeFileSync(arquivo, novo);
console.log(`Site vai chamar a API em ${url}`);
