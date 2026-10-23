import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { mensagemRedefinir } from '../email/modelos';
import { UsuarioService } from '../usuario/usuario.service';

const VALIDADE_MINUTOS = 60;
/** Um pedido por conta a cada 2 minutos: evita encher a caixa de alguem. */
const INTERVALO_MINUTOS = 2;

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * "Esqueci minha senha": link por e-mail que vale 1 hora e uma unica vez.
 * O banco guarda so o hash do codigo; o codigo em si so existe no e-mail.
 */
@Injectable()
export class RedefinirSenhaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usuarioService: UsuarioService,
    private readonly email: EmailService,
  ) {}

  /** Sem e-mail configurado, a tela orienta a pedir a senha a escola. */
  disponivel() {
    return { data: { porEmail: this.email.disponivel } };
  }

  /**
   * Responde sempre igual, exista o e-mail ou nao, para nao revelar quem
   * tem conta na Linka.
   */
  async pedir(emailInformado: string) {
    const usuario = await this.usuarioService.findByEmail(
      emailInformado.trim().toLowerCase(),
    );
    const podeEntrar =
      usuario?.ativo !== false && usuario?.escola?.ativo !== false;
    if (!usuario || !podeEntrar) return { data: true };

    const [recente]: unknown[] = await this.dataSource.query(
      `SELECT 1 FROM senha_reset
        WHERE usuario_id = ? AND criado_em > NOW() - INTERVAL ? MINUTE
        LIMIT 1`,
      [usuario.id, INTERVALO_MINUTOS],
    );
    if (recente) return { data: true };

    // Um link novo invalida os anteriores ainda nao usados.
    await this.dataSource.query(
      'UPDATE senha_reset SET usado_em = NOW() WHERE usuario_id = ? AND usado_em IS NULL',
      [usuario.id],
    );
    const token = randomBytes(32).toString('base64url');
    await this.dataSource.query(
      `INSERT INTO senha_reset (usuario_id, token_hash, expira_em)
       VALUES (?, ?, NOW() + INTERVAL ? MINUTE)`,
      [usuario.id, hash(token), VALIDADE_MINUTOS],
    );

    await this.email.enviar(
      usuario.email,
      mensagemRedefinir({
        nome: await this.nomeDe(usuario.id),
        url: this.email.url(`/redefinir-senha?token=${token}`),
        validadeMinutos: VALIDADE_MINUTOS,
      }),
    );
    return { data: true };
  }

  async redefinir(token: string, novaSenha: string) {
    const [pedido]: { id: number; usuarioId: number }[] =
      await this.dataSource.query(
        `SELECT id, usuario_id usuarioId FROM senha_reset
          WHERE token_hash = ? AND usado_em IS NULL AND expira_em > NOW()
          LIMIT 1`,
        [hash(token)],
      );
    if (!pedido) {
      throw new BadRequestException(
        'Link invalido ou expirado. Peca um link novo.',
      );
    }

    await this.usuarioService.definirSenha(Number(pedido.usuarioId), novaSenha);
    await this.dataSource.query(
      'UPDATE senha_reset SET usado_em = NOW() WHERE id = ?',
      [pedido.id],
    );
    return { data: true };
  }

  /** Nome para o "Olá, ..." do e-mail, venha de qual perfil vier. */
  private async nomeDe(usuarioId: number): Promise<string | null> {
    const [linha]: { nome: string | null }[] = await this.dataSource.query(
      `SELECT COALESCE(p.nome_completo, a.nome_completo, r.nome_completo,
                       IF(u.perfil = 'escola', e.nome, NULL)) nome
         FROM usuario u
         LEFT JOIN professor p ON p.usuario_id = u.id
         LEFT JOIN aluno a ON a.usuario_id = u.id
         LEFT JOIN responsavel r ON r.usuario_id = u.id
         LEFT JOIN escola e ON e.id = u.escola_id
        WHERE u.id = ?
        LIMIT 1`,
      [usuarioId],
    );
    return linha?.nome ?? null;
  }
}
