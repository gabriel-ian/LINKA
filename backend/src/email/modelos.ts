/** Conteudo de um e-mail: texto puro (sempre) e HTML simples. */
export interface Mensagem {
  assunto: string;
  texto: string;
  html: string;
}

export type PerfilAcesso =
  'escola' | 'professor' | 'aluno' | 'responsavel' | 'admin';

const ROTULO: Record<PerfilAcesso, string> = {
  escola: 'Escola',
  professor: 'Professor',
  aluno: 'Aluno',
  responsavel: 'Família',
  admin: 'ADM',
};

/** Escapa o que vem do banco antes de entrar no HTML. */
function h(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Moldura comum: cabecalho Linka, paragrafos e um botao opcional. */
function moldura(
  paragrafos: string[],
  botao?: { texto: string; url: string },
): string {
  const corpo = paragrafos
    .map((p) => `<p style="margin:0 0 14px;line-height:1.5">${p}</p>`)
    .join('');
  const acao = botao
    ? `<p style="margin:24px 0"><a href="${h(botao.url)}" style="background:#1a73e8;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">${h(botao.texto)}</a></p>`
    : '';
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#333;max-width:520px;margin:0 auto">
<h1 style="font-size:22px;color:#0b3d91;margin:0 0 20px">Linka</h1>
${corpo}${acao}
<p style="margin:28px 0 0;font-size:12px;color:#888">Mensagem automática da Linka. Não responda este e-mail.</p>
</div>`;
}

/** "Olá, Maria!" ou so "Olá!" quando o cadastro nao tem nome. */
function ola(nome: string | null): string {
  const primeiro = nome?.trim().split(/\s+/)[0];
  return primeiro ? `Olá, ${primeiro}!` : 'Olá!';
}

/** Senha provisoria gerada no cadastro ou numa redefinicao. */
export function mensagemAcesso(d: {
  nome: string | null;
  email: string;
  senha: string;
  perfil: PerfilAcesso;
  urlLogin: string;
}): Mensagem {
  const perfil = ROTULO[d.perfil];
  return {
    assunto: 'Seu acesso à Linka',
    texto: [
      ola(d.nome),
      '',
      `Seu acesso à Linka está pronto. Entre como "${perfil}" com:`,
      `E-mail: ${d.email}`,
      `Senha provisória: ${d.senha}`,
      '',
      `Acesse: ${d.urlLogin}`,
      'No primeiro acesso você pode criar uma senha só sua.',
    ].join('\n'),
    html: moldura(
      [
        h(ola(d.nome)),
        `Seu acesso à Linka está pronto. Entre como <b>${h(perfil)}</b> com:`,
        `E-mail: <b>${h(d.email)}</b><br>Senha provisória: <b style="font-family:monospace;font-size:16px">${h(d.senha)}</b>`,
        'No primeiro acesso você pode criar uma senha só sua.',
      ],
      { texto: 'Entrar na Linka', url: d.urlLogin },
    ),
  };
}

/** Link de "Esqueci minha senha". */
export function mensagemRedefinir(d: {
  nome: string | null;
  url: string;
  validadeMinutos: number;
}): Mensagem {
  return {
    assunto: 'Criar uma nova senha na Linka',
    texto: [
      ola(d.nome),
      '',
      'Recebemos um pedido para criar uma nova senha na Linka.',
      `Use o link abaixo (vale por ${d.validadeMinutos} minutos):`,
      d.url,
      '',
      'Se não foi você, ignore este e-mail: sua senha continua a mesma.',
    ].join('\n'),
    html: moldura(
      [
        h(ola(d.nome)),
        'Recebemos um pedido para criar uma nova senha na Linka.',
        `O link vale por ${d.validadeMinutos} minutos.`,
        'Se não foi você, ignore este e-mail: sua senha continua a mesma.',
      ],
      { texto: 'Criar nova senha', url: d.url },
    ),
  };
}

/** Relatorio semanal da familia: um paragrafo por filho. */
export function mensagemResumoSemanal(d: {
  nome: string | null;
  filhos: { nome: string; resumo: string }[];
  urlPainel: string;
}): Mensagem {
  return {
    assunto: 'Resumo da semana na Linka',
    texto: [
      ola(d.nome),
      '',
      ...d.filhos.flatMap((f) => [`${f.nome}:`, f.resumo, '']),
      `Veja os detalhes no painel: ${d.urlPainel}`,
      'Para não receber mais, desligue "Relatório semanal por e-mail" em Configurações.',
    ].join('\n'),
    html: moldura(
      [
        `${h(ola(d.nome))} Veja como foi a semana:`,
        ...d.filhos.map((f) => `<b>${h(f.nome)}</b><br>${h(f.resumo)}`),
        '<span style="font-size:13px;color:#666">Para não receber mais, desligue "Relatório semanal por e-mail" em Configurações.</span>',
      ],
      { texto: 'Abrir o painel', url: d.urlPainel },
    ),
  };
}
