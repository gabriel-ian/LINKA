import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ConfigIaCompativel, chamarIaCompativel } from './ia-compativel';

const MODELO = 'claude-opus-5-5';

/** Perfil enviado para a IA. So o primeiro nome: nada de CGM, laudo ou e-mail. */
export interface PerfilParaIa {
  alunoId: number;
  primeiroNome: string;
  idade: number | null;
  diagnosticos: string[];
  interesses: string[];
  dificuldades: string | null;
}

const AdaptacoesSchema = z.object({
  adaptacoes: z.array(
    z.object({
      alunoId: z.number().int(),
      passos: z.array(z.string()),
      recursos: z.array(z.string()),
      materiais: z.array(z.string()),
    }),
  ),
});

const SimplificadoSchema = z.object({ texto: z.string() });

const INSTRUCOES_TAREFA = `Você é a assistente pedagógica da Linka, plataforma que apoia alunos com necessidades educacionais especiais (TDAH, TEA, dislexia, discalculia, deficiências visuais e auditivas) em escolas brasileiras.

O professor escreveu uma tarefa para a turma inteira. Para cada aluno informado, reescreva a tarefa como uma sequência de passos curtos que o próprio aluno vai seguir sozinho, em português do Brasil.

Regras:
- De 3 a 7 passos, cada um com uma única ação, em frases curtas e diretas (até cerca de 15 palavras), no imperativo e falando com o aluno ("Separe o caderno...").
- Mantenha exatamente o mesmo conteúdo, exercícios e exigências do professor. Não acrescente nem remova trabalho, não dê respostas e não invente informações que não estão no enunciado.
- Ajuste ao perfil de cada aluno (se ele tiver mais de um, combine as adaptações):
  - TDAH: o primeiro passo prepara o material e tira distrações da mesa; divida o trabalho em blocos pequenos (ex.: "Faça os exercícios 1 e 2") e, em tarefas longas, inclua um passo curto de pausa ("Respire e estique os braços por 1 minuto").
  - TEA: linguagem literal e previsível, sem metáforas, ironia ou expressões figuradas; diga logo no primeiro passo quantos passos são e como a tarefa termina ("São 5 passos. No último você confere as respostas."); evite mudanças de ordem ou surpresas.
  - Dislexia: frases ainda mais curtas, palavras simples e do dia a dia, um número por passo; evite letras parecidas em sequência e siglas sem explicação.
  - Discalculia: explicite cada operação numérica, uma conta por passo, e sugira apoio concreto quando ajudar (dedos, desenho, tabela, material dourado).
  - Deficiência visual (baixa visão ou cegueira): não dependa de cores, imagens ou posição na página ("o quadro azul", "a figura ao lado"); descreva o que precisa ser lido e sugira ouvir o passo ou ampliar o texto.
  - Deficiência auditiva ou surdez: não dependa de áudio, vídeo falado ou instruções orais; use frases escritas claras e, quando houver áudio na tarefa, peça ajuda com legenda ou intérprete.
  - Dificuldade de leitura ou de atenção sem diagnóstico detalhado: siga as regras de TDAH e dislexia.
- O último passo é sempre conferir ou entregar ("Confira se fez todos os exercícios e marque como feito").
- Quando fizer sentido, use um interesse do aluno em um exemplo, sem mudar a tarefa.
- Em "recursos", liste de 1 a 3 etiquetas curtas descrevendo o que você usou, como "5 passos curtos", "Linguagem literal", "Pausa no meio" ou "Exemplo com dinossauros".
- Em "materiais", liste de 0 a 4 objetos que o aluno precisa ter em mãos, em poucas palavras ("Caderno de Matemática", "Lápis", "Régua"). Só o que a tarefa pede ou claramente exige.
- Devolva uma adaptação para cada alunoId recebido, usando o mesmo alunoId.

Pedidos do professor (quando vierem no conteúdo):
- "orientacaoDoProfessor": siga essa orientação em todas as adaptações (ex.: tema dos exemplos, número de passos, tom).
- "pedidoDeMudanca" com a "versaoAtual" do aluno: parta da versão atual e aplique somente o que o professor pediu, mantendo o resto.
- Os pedidos do professor nunca anulam as regras acima: não remova trabalho da tarefa, não dê respostas e não invente conteúdo. Se um pedido for contra elas, siga o pedido só até onde for possível.`;

const AjudaSchema = z.object({ texto: z.string(), pergunta: z.string() });

const INSTRUCOES_AJUDA = `Você é o mascote da Linka, que ajuda um aluno com necessidades educacionais especiais (TDAH, TEA, dislexia, discalculia...) a destravar um passo de uma tarefa escolar, em português do Brasil.

Você recebe a tarefa, o passo em que o aluno travou, o perfil dele e o tipo de ajuda:
- "explicar": explique o MESMO passo de outro jeito, com uma comparação usando um interesse do aluno (se houver).
- "exemplo": mostre um exemplo PARECIDO, com outros números ou outro texto, resolvido passo a passo.

Regras:
- Nunca resolva o exercício da tarefa nem dê a resposta dele. O exemplo deve ser diferente do exercício real.
- "texto": de 2 a 4 frases curtas, falando direto com o aluno, sem metáforas confusas para quem tem TEA.
- "pergunta": uma pergunta curta que leva o aluno de volta ao passo (ex.: "Agora volte ao exercício 5: quantas partes você tem?").
- O texto será lido em voz alta.`;

const INSTRUCOES_COMUNICADO = `Você é a assistente pedagógica da Linka. Reescreva o aviso do professor em uma versão simplificada para alunos com necessidades educacionais especiais, em português do Brasil: frases curtas, linguagem literal, sem metáforas, mantendo todas as informações (datas, horários, o que levar ou estudar). Não acrescente nada que não esteja no aviso. O texto será lido em voz alta para o aluno.`;

/**
 * Adapta tarefas e avisos com IA. Usa o Claude (ANTHROPIC_API_KEY) ou, sem
 * ele, um servico compativel com a OpenAI (IA_URL + IA_MODELO + IA_CHAVE:
 * Groq, Gemini, OpenRouter, Ollama...). Sem nenhum, `disponivel` fica false
 * e o professor adapta a mao.
 */
@Injectable()
export class AdaptacaoIaService {
  private readonly logger = new Logger(AdaptacaoIaService.name);
  private readonly cliente: Anthropic | null;
  private readonly compativel: ConfigIaCompativel | null;

  constructor(config: ConfigService) {
    const chave = config.get<string>('ANTHROPIC_API_KEY');
    this.cliente = chave ? new Anthropic({ apiKey: chave }) : null;

    const url = config.get<string>('IA_URL');
    const modelo = config.get<string>('IA_MODELO');
    this.compativel =
      !this.cliente && url && modelo
        ? { url, modelo, chave: config.get<string>('IA_CHAVE') || undefined }
        : null;

    if (this.cliente) {
      this.logger.log(`Adaptacao por IA ligada (Claude ${MODELO})`);
    } else if (this.compativel) {
      this.logger.log(
        `Adaptacao por IA ligada (${this.compativel.modelo} em ${new URL(url!).host})`,
      );
    } else {
      this.logger.warn(
        'Adaptacao por IA desligada: defina ANTHROPIC_API_KEY ou IA_URL + IA_MODELO no .env',
      );
    }
  }

  get disponivel(): boolean {
    return this.cliente !== null || this.compativel !== null;
  }

  async adaptarTarefa(
    tarefa: { titulo: string; disciplina: string | null; enunciado: string },
    perfis: (PerfilParaIa & { versaoAtual?: string[] })[],
    pedidos: { orientacao?: string | null; mudanca?: string | null } = {},
  ): Promise<z.infer<typeof AdaptacoesSchema>['adaptacoes']> {
    if (perfis.length === 0) return [];

    const resposta = await this.chamar(
      INSTRUCOES_TAREFA,
      JSON.stringify(
        {
          tarefa,
          ...(pedidos.orientacao && {
            orientacaoDoProfessor: pedidos.orientacao,
          }),
          ...(pedidos.mudanca && { pedidoDeMudanca: pedidos.mudanca }),
          alunos: perfis,
        },
        null,
        2,
      ),
      AdaptacoesSchema,
    );

    const ids = new Set(perfis.map((p) => p.alunoId));
    return resposta.adaptacoes.filter(
      (a) => ids.has(a.alunoId) && a.passos.length > 0,
    );
  }

  async simplificarComunicado(
    titulo: string,
    mensagem: string,
  ): Promise<string> {
    const resposta = await this.chamar(
      INSTRUCOES_COMUNICADO,
      JSON.stringify({ titulo, mensagem }, null, 2),
      SimplificadoSchema,
    );
    return resposta.texto;
  }

  /** Tela "Precisa de ajuda?": explica o passo de outro jeito ou da um exemplo parecido. */
  async ajudarPasso(dados: {
    tipo: 'explicar' | 'exemplo';
    tarefa: { titulo: string; disciplina: string | null; enunciado: string };
    passo: string;
    aluno: {
      primeiroNome: string;
      diagnosticos: string[];
      interesses: string[];
    };
  }): Promise<z.infer<typeof AjudaSchema>> {
    return this.chamar(
      INSTRUCOES_AJUDA,
      JSON.stringify(dados, null, 2),
      AjudaSchema,
    );
  }

  private async chamar<T extends z.ZodType>(
    sistema: string,
    conteudo: string,
    schema: T,
  ): Promise<z.infer<T>> {
    if (!this.cliente && this.compativel) {
      return chamarIaCompativel(this.compativel, sistema, conteudo, schema);
    }
    if (!this.cliente) {
      throw new ServiceUnavailableException(
        'Adaptacao por IA nao configurada (ANTHROPIC_API_KEY)',
      );
    }

    try {
      const resposta = await this.cliente.beta.messages.parse({
        model: MODELO,
        max_tokens: 16000,
        // Se o modelo recusar por engano (falso positivo de seguranca), a
        // propria API refaz o pedido em outro modelo na mesma chamada.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        // Tarefa simples e repetitiva: effort baixo segura custo e espera.
        output_config: { effort: 'low', format: betaZodOutputFormat(schema) },
        system: sistema,
        messages: [{ role: 'user', content: conteudo }],
      });

      if (resposta.stop_reason === 'refusal' || !resposta.parsed_output) {
        this.logger.warn(
          `IA sem resultado utilizavel (stop_reason=${resposta.stop_reason})`,
        );
        throw new ServiceUnavailableException(
          'A IA nao conseguiu gerar a adaptacao agora',
        );
      }

      return resposta.parsed_output;
    } catch (erro) {
      if (erro instanceof ServiceUnavailableException) throw erro;
      if (erro instanceof Anthropic.AuthenticationError) {
        this.logger.error('ANTHROPIC_API_KEY invalida');
        throw new ServiceUnavailableException('Chave da IA invalida');
      }
      if (erro instanceof Anthropic.RateLimitError) {
        throw new ServiceUnavailableException(
          'IA ocupada no momento, tente de novo em instantes',
        );
      }
      if (erro instanceof Anthropic.APIError) {
        this.logger.error(
          `Erro da API Anthropic ${erro.status}: ${erro.message}`,
        );
        throw new ServiceUnavailableException(
          'Nao foi possivel falar com a IA agora',
        );
      }
      throw erro;
    }
  }
}
