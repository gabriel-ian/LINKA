import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { EmailService } from '../email/email.service';
import { mensagemResumoSemanal } from '../email/modelos';
import { PainelFamiliaService } from './painel-familia.service';

/** "Relatorio semanal por e-mail - Todo domingo as 18h" das Configuracoes. */
@Injectable()
export class ResumoEmailService {
  private readonly logger = new Logger(ResumoEmailService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly familia: PainelFamiliaService,
    private readonly email: EmailService,
  ) {}

  @Cron('0 18 * * 0', { timeZone: 'America/Sao_Paulo' })
  async enviarDaSemana(): Promise<{ enviados: number }> {
    // Sem SMTP nao ha o que enviar (e nao vale montar centenas de resumos).
    if (!this.email.disponivel) return { enviados: 0 };

    // Familias ativas com ao menos um filho ativo em escola ativa.
    const familias: {
      id: number;
      nome: string | null;
      email: string;
      preferencias: unknown;
    }[] = await this.dataSource.query(
      `SELECT r.id, r.nome_completo nome, u.email, r.preferencias
         FROM responsavel r
         JOIN usuario u ON u.id = r.usuario_id AND u.ativo = 1
        WHERE EXISTS (
          SELECT 1 FROM aluno_responsavel ar
            JOIN aluno a ON a.id = ar.aluno_id AND a.ativo = 1
            JOIN escola e ON e.id = a.escola_id AND e.ativo = 1
           WHERE ar.responsavel_id = r.id)`,
    );

    let enviados = 0;
    for (const f of familias) {
      try {
        const filhos = await this.familia.resumosParaEmail(
          Number(f.id),
          f.preferencias,
        );
        if (!filhos.length) continue;
        const ok = await this.email.enviar(
          f.email,
          mensagemResumoSemanal({
            nome: f.nome,
            filhos,
            urlPainel: this.email.url('/familia'),
          }),
        );
        if (ok) enviados++;
      } catch (erro) {
        // Uma familia com problema nao impede o envio para as outras.
        this.logger.error(
          `Resumo da familia ${f.id}: ${erro instanceof Error ? erro.message : String(erro)}`,
        );
      }
    }
    this.logger.log(
      `Resumo semanal: ${enviados} de ${familias.length} familias`,
    );
    return { enviados };
  }
}
