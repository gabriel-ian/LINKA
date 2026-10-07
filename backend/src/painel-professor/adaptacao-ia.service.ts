import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

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
    }),
  ),
});

const SimplificadoSchema = z.object({ texto: z.string() });

const INSTRUCOES_TAREFA = `Você é a assistente pedagógica da Linka, plataforma que apoia alunos com necessidades educacionais especiais (TDAH, TEA, dislexia, discalculia, deficiências visuais e auditivas) em escolas brasileiras.

O professor escreveu uma tarefa para a turma inteira. Para cada aluno informado, reescreva a tarefa como uma sequência de passos curtos que o próprio aluno vai seguir sozinho, em português do Brasil.

Regras:
- De 3 a 7 passos, cada um com uma única ação, em frases curtas e diretas (até cerca de 15 palavras), no imperativo e falando com o aluno ("Separe o caderno...").
- Mantenha exatamente o mesmo conteúdo, exercícios e exigências do professor. Não acrescente nem remova trabalho, não dê respostas e não invente informações que não estão no enunciado.
- Ajuste ao perfil: para TDAH, o primeiro passo prepara o material e os passos dividem o trabalho em blocos pequenos; para TEA, linguagem literal e previsível, sem metáforas; para dislexia, frases ainda mais curtas e palavras simples; para discalculia, explicite cada operação numérica.
- Quando fizer sentido, use um interesse do aluno em um exemplo, sem mudar a tarefa.
- Em "recursos", liste de 1 a 3 etiquetas curtas descrevendo o que você usou, como "5 passos curtos", "Linguagem literal" ou "Exemplo com dinossauros".
- Devolva uma adaptação para cada alunoId recebido, usando o mesmo alunoId.`;

const INSTRUCOES_COMUNICADO = `Você é a assistente pedagógica da Linka. Reescreva o aviso do professor em uma versão simplificada para alunos com necessidades educacionais especiais, em português do Brasil: frases curtas, linguagem literal, sem metáforas, mantendo todas as informações (datas, horários, o que levar ou estudar). Não acrescente nada que não esteja no aviso. O texto será lido em voz alta para o aluno.`;

/**
 * Adapta tarefas e avisos com a API do Claude. Sem ANTHROPIC_API_KEY
 * (ou login do `ant`), `disponivel` fica false e o professor adapta a mao.
 */
@Injectable()
export class AdaptacaoIaService {
  private readonly logger = new Logger(AdaptacaoIaService.name);
  private readonly cliente: Anthropic | null;

  constructor(config: ConfigService) {
    const chave = config.get<string>('ANTHROPIC_API_KEY');
    this.cliente = chave ? new Anthropic({ apiKey: chave }) : null;
  }

  get disponivel(): boolean {
    return this.cliente !== null;
  }

  async adaptarTarefa(
    tarefa: { titulo: string; disciplina: string | null; enunciado: string },
    perfis: PerfilParaIa[],
  ): Promise<z.infer<typeof AdaptacoesSchema>['adaptacoes']> {
    if (perfis.length === 0) return [];

    const resposta = await this.chamar(
      INSTRUCOES_TAREFA,
      JSON.stringify({ tarefa, alunos: perfis }, null, 2),
      AdaptacoesSchema,
    );

    const ids = new Set(perfis.map((p) => p.alunoId));
    return resposta.adaptacoes.filter((a) => ids.has(a.alunoId) && a.passos.length > 0);
  }

  async simplificarComunicado(titulo: string, mensagem: string): Promise<string> {
    const resposta = await this.chamar(
      INSTRUCOES_COMUNICADO,
      JSON.stringify({ titulo, mensagem }, null, 2),
      SimplificadoSchema,
    );
    return resposta.texto;
  }

  private async chamar<T extends z.ZodType>(sistema: string, conteudo: string, schema: T): Promise<z.infer<T>> {
    if (!this.cliente) {
      throw new ServiceUnavailableException('Adaptacao por IA nao configurada (ANTHROPIC_API_KEY)');
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
        this.logger.warn(`IA sem resultado utilizavel (stop_reason=${resposta.stop_reason})`);
        throw new ServiceUnavailableException('A IA nao conseguiu gerar a adaptacao agora');
      }

      return resposta.parsed_output as z.infer<T>;
    } catch (erro) {
      if (erro instanceof ServiceUnavailableException) throw erro;
      if (erro instanceof Anthropic.AuthenticationError) {
        this.logger.error('ANTHROPIC_API_KEY invalida');
        throw new ServiceUnavailableException('Chave da IA invalida');
      }
      if (erro instanceof Anthropic.RateLimitError) {
        throw new ServiceUnavailableException('IA ocupada no momento, tente de novo em instantes');
      }
      if (erro instanceof Anthropic.APIError) {
        this.logger.error(`Erro da API Anthropic ${erro.status}: ${erro.message}`);
        throw new ServiceUnavailableException('Nao foi possivel falar com a IA agora');
      }
      throw erro;
    }
  }
}
