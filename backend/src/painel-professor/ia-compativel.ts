import { ServiceUnavailableException } from '@nestjs/common';
import { z } from 'zod';

/**
 * Servicos de IA que aceitam o formato de chat da OpenAI: Groq, Google Gemini
 * (endpoint compativel), OpenRouter, Ollama (local) e a propria OpenAI.
 * Configurado por IA_URL, IA_MODELO e IA_CHAVE no .env.
 */
export interface ConfigIaCompativel {
  /** Ex.: https://api.groq.com/openai/v1 ou http://localhost:11434/v1 */
  url: string;
  modelo: string;
  /** Vazio para servicos locais (Ollama). */
  chave?: string;
}

/** Erro de uma chamada, ja com a mensagem que a tela traduz. */
function indisponivel(mensagem: string): ServiceUnavailableException {
  return new ServiceUnavailableException(mensagem);
}

/**
 * Pede a resposta em JSON, no formato do schema, e confere com o zod. Modelos
 * gratuitos as vezes erram o formato: uma segunda tentativa avisa o erro.
 */
export async function chamarIaCompativel<T extends z.ZodType>(
  cfg: ConfigIaCompativel,
  sistema: string,
  conteudo: string,
  schema: T,
  tentativas = 2,
): Promise<z.infer<T>> {
  const formato = JSON.stringify(z.toJSONSchema(schema));
  const mensagens: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[] = [
    {
      role: 'system',
      content: `${sistema}\n\nResponda SOMENTE com um objeto JSON valido, sem texto antes ou depois, seguindo este JSON Schema:\n${formato}`,
    },
    { role: 'user', content: conteudo },
  ];

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    let resposta: Response;
    try {
      resposta = await fetch(`${cfg.url.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.chave && { Authorization: `Bearer ${cfg.chave}` }),
        },
        body: JSON.stringify({
          model: cfg.modelo,
          messages: mensagens,
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch {
      throw indisponivel('Nao foi possivel falar com a IA agora');
    }

    if (resposta.status === 401 || resposta.status === 403) {
      throw indisponivel('Chave da IA invalida');
    }
    if (resposta.status === 429) {
      throw indisponivel('IA ocupada no momento, tente de novo em instantes');
    }
    if (!resposta.ok) {
      throw indisponivel('Nao foi possivel falar com a IA agora');
    }

    const corpo = (await resposta.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const texto = corpo.choices?.[0]?.message?.content ?? '';
    const resultado = schema.safeParse(lerJson(texto));
    if (resultado.success) return resultado.data;

    // Formato errado: pede de novo mostrando o que faltou.
    mensagens.push(
      { role: 'assistant', content: texto },
      {
        role: 'user',
        content: `A resposta nao seguiu o formato pedido (${resultado.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.') || 'raiz'}: ${i.message}`)
          .join('; ')}). Responda de novo, so com o JSON no formato do schema.`,
      },
    );
  }
  throw indisponivel('A IA nao conseguiu gerar a adaptacao agora');
}

/** JSON da resposta, mesmo vindo dentro de ```json ... ``` ou com texto em volta. */
export function lerJson(texto: string): unknown {
  const limpo = texto.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(limpo);
  } catch {
    const inicio = limpo.indexOf('{');
    const fim = limpo.lastIndexOf('}');
    if (inicio >= 0 && fim > inicio) {
      try {
        return JSON.parse(limpo.slice(inicio, fim + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
