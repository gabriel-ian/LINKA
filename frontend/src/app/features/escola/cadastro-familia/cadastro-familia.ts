import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FamiliaCriada } from '../../../core/model/painel-escola.model';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { AdmResultado } from '../../adm/resultado/resultado';
import { PARENTESCOS } from '../escolha-familia/escolha-familia';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cadastrar a familia antes dos filhos: depois, cada filho escolhe esta
 * familia no cadastro do aluno (sem repetir os dados do responsavel).
 */
@Component({
  selector: 'app-escola-cadastro-familia',
  imports: [FormsModule, RouterLink, AdmResultado],
  templateUrl: './cadastro-familia.html',
  styleUrl: '../cadastro-professor/cadastro.css',
})
export class EscolaCadastroFamilia {
  private service = inject(PainelEscolaService);

  readonly parentescos = PARENTESCOS;
  nome = '';
  email = '';
  telefone = '';
  parentesco = '';

  readonly erros = signal<{ nome?: string; email?: string }>({});
  readonly erroGeral = signal('');
  readonly salvando = signal(false);
  readonly criada = signal<FamiliaCriada | null>(null);

  salvar(): void {
    const e: { nome?: string; email?: string } = {};
    if (!this.nome.trim()) e.nome = 'Informe o nome do responsável.';
    if (!EMAIL.test(this.email.trim())) e.email = 'Informe um e-mail válido.';
    this.erros.set(e);
    if (Object.keys(e).length) return;

    this.salvando.set(true);
    this.erroGeral.set('');
    this.service
      .criarFamilia({
        nomeCompleto: this.nome.trim(),
        email: this.email.trim(),
        telefone: this.telefone.trim() || undefined,
        parentesco: this.parentesco || undefined,
      })
      .subscribe({
        next: (res) => {
          this.salvando.set(false);
          this.criada.set(res.data);
        },
        error: (err: HttpErrorResponse) => {
          this.salvando.set(false);
          const msg = [err.error?.message].flat().join(' ');
          if (/familia com este e-mail/i.test(msg))
            this.erros.set({ email: 'Já existe uma família com este e-mail. Busque em Famílias.' });
          else if (/outro tipo de conta/i.test(msg))
            this.erros.set({ email: 'Este e-mail já é usado por outro tipo de conta.' });
          else this.erroGeral.set(mensagemDeErro(err, 'Não foi possível cadastrar a família.'));
        },
      });
  }

  outra(): void {
    this.nome = this.email = this.telefone = this.parentesco = '';
    this.criada.set(null);
    this.erros.set({});
  }
}
