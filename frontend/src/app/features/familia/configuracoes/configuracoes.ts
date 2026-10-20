import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PreferenciasFamilia } from '../../../core/model/painel-familia.model';
import { PainelFamiliaService } from '../../../core/services/painel-familia.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { baixarJson, nomeDeArquivo } from '../../../core/util/baixar-json';
import { FamiliaContexto } from '../familia-contexto';

type Chave = Exclude<keyof PreferenciasFamilia, 'horario'>;

/** "Familia - Configuracoes" do Figma. */
@Component({
  selector: 'app-familia-configuracoes',
  imports: [FormsModule, RouterLink],
  templateUrl: './configuracoes.html',
  styleUrls: ['../familia-comum.css', './configuracoes.css'],
})
export class FamiliaConfiguracoes {
  readonly contexto = inject(FamiliaContexto);
  private service = inject(PainelFamiliaService);

  /** emBreve: ainda nao existe envio (o botao fica desligado). */
  readonly opcoes: { chave: Chave; titulo: string; texto: string; emBreve?: boolean }[] = [
    {
      chave: 'tarefaNaoIniciada',
      titulo: 'Tarefa com prazo hoje não iniciada',
      texto: 'Aviso por e-mail até 3h antes do prazo (sem horário: no horário preferido)',
    },
    {
      chave: 'tarefaConcluida',
      titulo: 'Tarefa concluída',
      texto: 'Aviso por e-mail, para você comemorar junto',
    },
    {
      chave: 'avisosEscola',
      titulo: 'Avisos da escola',
      texto: 'Comunicados de professores e coordenação, por e-mail',
    },
    {
      chave: 'relatorioSemanal',
      titulo: 'Relatório semanal por e-mail',
      texto: 'Todo domingo às 18h',
    },
    {
      chave: 'resumoWhatsapp',
      titulo: 'Resumo diário por WhatsApp',
      texto: 'Em breve',
      emBreve: true,
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
  /** Mensagem por filho na secao "Seus dados (LGPD)". */
  readonly avisoDados = signal<Record<number, string>>({});

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

  baixarDados(filhoId: number, nome: string): void {
    this.service.dadosDoFilho(filhoId).subscribe({
      next: (res) => baixarJson(`dados-${nomeDeArquivo(nome)}.json`, res.data),
      error: () => this.avisar(filhoId, 'Não foi possível baixar os dados agora.'),
    });
  }

  pedirExclusao(filhoId: number, nome: string): void {
    if (
      !confirm(
        `Pedir a exclusão dos dados de ${nome}?

A escola recebe o pedido e apaga os dados ` +
          'pessoais e de saúde. Depois disso o acompanhamento pela Linka termina.',
      )
    )
      return;
    this.service.pedirExclusao(filhoId).subscribe({
      next: () => this.avisar(filhoId, 'Pedido enviado. A escola vai atender e avisar você.'),
      error: () => this.avisar(filhoId, 'Não foi possível enviar o pedido agora.'),
    });
  }

  private avisar(filhoId: number, texto: string): void {
    this.avisoDados.update((a) => ({ ...a, [filhoId]: texto }));
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
