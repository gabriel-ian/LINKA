import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { Mensagem, PerfilAcesso, mensagemAcesso } from './modelos';

/**
 * Envio de e-mails da Linka por SMTP. Sem SMTP_HOST no .env, `disponivel`
 * fica false: nada e enviado e o conteudo vai para o terminal, para testar
 * em desenvolvimento.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporte: Transporter | null;
  private readonly remetente: string;
  private readonly frontend: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const porta = Number(config.get<string>('SMTP_PORT') ?? 587);
    const usuario = config.get<string>('SMTP_USER');

    this.frontend = (
      config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200'
    ).replace(/\/$/, '');
    this.remetente =
      config.get<string>('MAIL_FROM') ?? 'Linka <nao-responda@linka.app>';
    this.transporte = host
      ? createTransport({
          host,
          port: porta,
          // 465 usa TLS direto; 587 e 25 sobem para TLS com STARTTLS.
          secure: porta === 465,
          auth: usuario
            ? { user: usuario, pass: config.get<string>('SMTP_PASS') }
            : undefined,
        })
      : null;

    if (this.transporte) {
      this.logger.log(`Envio de e-mail ligado (${host}:${porta})`);
    } else {
      this.logger.warn(
        'Envio de e-mail desligado: defina SMTP_HOST no .env (os e-mails vao para o terminal)',
      );
    }
  }

  get disponivel(): boolean {
    return this.transporte !== null;
  }

  /** Endereco completo de uma tela do frontend, para os links dos e-mails. */
  url(caminho: string): string {
    return this.frontend + caminho;
  }

  /**
   * Senha provisoria por e-mail. Dispara sem esperar (a tela da escola ja
   * mostra a senha); falhas ficam so no log.
   */
  enviarAcesso(d: {
    nome: string | null;
    email: string;
    senha: string;
    perfil: PerfilAcesso;
  }): void {
    const urlLogin = this.url(d.perfil === 'admin' ? '/adm/login' : '/login');
    void this.enviar(d.email, mensagemAcesso({ ...d, urlLogin }));
  }

  /**
   * Envia e devolve se deu certo. Nunca lanca erro: um e-mail que falhou
   * nao deve desfazer o cadastro ou a troca de senha que o originou.
   */
  async enviar(para: string, mensagem: Mensagem): Promise<boolean> {
    if (!this.transporte) {
      this.logger.log(
        `[e-mail nao enviado] Para: ${para} | ${mensagem.assunto}\n${mensagem.texto}`,
      );
      return false;
    }
    try {
      await this.transporte.sendMail({
        from: this.remetente,
        to: para,
        subject: mensagem.assunto,
        text: mensagem.texto,
        html: mensagem.html,
      });
      return true;
    } catch (erro) {
      this.logger.error(
        `Falha ao enviar "${mensagem.assunto}" para ${para}: ${
          erro instanceof Error ? erro.message : String(erro)
        }`,
      );
      return false;
    }
  }
}
