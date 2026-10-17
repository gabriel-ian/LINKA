import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PreferenciasFamilia } from '../../../core/model/painel-familia.model';
import { PainelFamiliaService } from '../../../core/services/painel-familia.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { FamiliaContexto } from '../familia-contexto';

type Chave = Exclude<keyof PreferenciasFamilia, 'horario'>;

/** "Familia - Configuracoes" do Figma. */
@Component({
  selector: 'app-familia-configuracoes',
  imports: [FormsModule],
  templateUrl: './configuracoes.html',
  styleUrls: ['../familia-comum.css', './configuracoes.css'],
})
export class FamiliaConfiguracoes {
  readonly contexto = inject(FamiliaContexto);
  private service = inject(PainelFamiliaService);

  readonly opcoes: { chave: Chave; titulo: string; texto: string }[] = [
    {
      chave: 'tarefaNaoIniciada',
      titulo: 'Tarefa com prazo hoje não iniciada',
      texto: 'Aviso até 3h antes do prazo',
    },
    { chave: 'tarefaConcluida', titulo: 'Tarefa concluída', texto: 'Para você comemorar junto' },
    {
      chave: 'avisosEscola',
      titulo: 'Avisos da escola',
      texto: 'Comunicados de professores e coordenação',
    },
    {
      chave: 'relatorioSemanal',
      titulo: 'Relatório semanal por e-mail',
      texto: 'Todo domingo às 18h',
    },
    {
      chave: 'resumoWhatsapp',
      titulo: 'Resumo diário por WhatsApp',
      texto: 'Um resumo curto no fim do dia',
    },
  ];

  readonly horarios = ['8h às 12h', '12h às 14h', '14h às 18h', '18h às 21h'];

  readonly nome = signal('');
  readonly email = signal('');
  readonly telefone = signal('');
  readonly salvando = signal(false);
  readonly mensagem = signal('');
  readonly erro = signal('');
  readonly pedirVinculo = signal(false);

  constructor() {
    // Preenche o formulario quando os dados chegam (uma vez).
    let preenchido = false;
    effect(() => {
      const r = this.contexto.dados()?.responsavel;
      if (!r || preenchido) return;
      preenchido = true;
      this.nome.set(r.nome);
      this.email.set(r.email ?? '');
      this.telefone.set(r.telefone ?? '');
    });
  }

  alternar(chave: Chave): void {
    const atual = this.contexto.dados()?.responsavel.preferencias;
    if (atual) this.salvarPreferencias({ [chave]: !atual[chave] });
  }

  escolherHorario(horario: string): void {
    this.salvarPreferencias({ horario });
  }

  private salvarPreferencias(mudanca: Partial<PreferenciasFamilia>): void {
    const d = this.contexto.dados();
    if (!d) return;
    const antes = d.responsavel.preferencias;
    // Muda na tela na hora; volta se o servidor recusar.
    this.contexto.dados.set({
      ...d,
      responsavel: { ...d.responsavel, preferencias: { ...antes, ...mudanca } },
    });
    this.erro.set('');
    this.service.salvarPerfil({ preferencias: mudanca }).subscribe({
      error: (e) => {
        const agora = this.contexto.dados();
        if (agora)
          this.contexto.dados.set({
            ...agora,
            responsavel: { ...agora.responsavel, preferencias: antes },
          });
        this.erro.set(mensagemDeErro(e, 'Não foi possível salvar a preferência.'));
      },
    });
  }

  salvarDados(): void {
    if (this.salvando()) return;
    const nome = this.nome().trim();
    const email = this.email().trim();
    if (!nome) {
      this.erro.set('Informe o nome completo.');
      return;
    }
    this.salvando.set(true);
    this.erro.set('');
    this.mensagem.set('');
    this.service
      .salvarPerfil({
        nomeCompleto: nome,
        telefone: this.telefone().trim(),
        ...(email ? { email } : {}),
      })
      .subscribe({
        next: (res) => {
          this.salvando.set(false);
          this.contexto.dados.set(res.data);
          this.mensagem.set('Dados salvos.');
        },
        error: (e) => {
          this.salvando.set(false);
          this.erro.set(mensagemDeErro(e, 'Não foi possível salvar os dados.'));
        },
      });
  }
}
