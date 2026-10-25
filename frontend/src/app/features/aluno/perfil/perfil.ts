import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Mascote, PreferenciasAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { AlunoContexto } from '../aluno-contexto';

type Chave =
  'ouvirVoz' | 'passosCurtos' | 'letrasMaiores' | 'fonteDislexia' | 'altoContraste' | 'modoCalmo';

const MASCOTES: { id: Mascote; nome: string; letra: string; jeito: string }[] = [
  { id: 'dino', nome: 'Dino', letra: 'D', jeito: 'animado e divertido' },
  { id: 'coruja', nome: 'Coruja', letra: 'C', jeito: 'calma e sabida' },
  { id: 'robo', nome: 'Robô', letra: 'R', jeito: 'direto e organizado' },
];

const CORES_INTERESSE = ['verde', 'azul', 'roxo', 'laranja'];

/** "Aluno - Meu perfil" do Figma. Cada mudanca e salva na hora. */
@Component({
  selector: 'app-aluno-perfil',
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class AlunoPerfil {
  private service = inject(PainelAlunoService);
  readonly contexto = inject(AlunoContexto);

  readonly mascotes = MASCOTES;
  readonly opcoes: { chave: Chave; titulo: string; texto: string }[] = [
    {
      chave: 'ouvirVoz',
      titulo: 'Ouvir as tarefas em voz alta',
      texto: 'A Linka lê cada passo para você',
    },
    { chave: 'passosCurtos', titulo: 'Passos curtos', texto: 'No máximo 3 linhas por passo' },
    { chave: 'letrasMaiores', titulo: 'Letras maiores', texto: 'Deixa o texto mais fácil de ler' },
    {
      chave: 'fonteDislexia',
      titulo: 'Letra para dislexia',
      texto: 'Uma letra mais fácil de ler, com mais espaço entre as palavras',
    },
    {
      chave: 'altoContraste',
      titulo: 'Alto contraste',
      texto: 'Texto mais escuro e bordas mais fortes',
    },
    { chave: 'modoCalmo', titulo: 'Modo calmo', texto: 'Menos cores e animações' },
  ];

  readonly adicionando = signal(false);
  readonly erro = signal('');
  novoInteresse = '';

  constructor() {
    effect(() => {
      if (this.contexto.resumo()) this.contexto.fala.set('Aqui você escolhe como quer aprender!');
    });
  }

  mascote(id: Mascote) {
    return MASCOTES.find((m) => m.id === id) ?? MASCOTES[0];
  }

  corInteresse(i: number): string {
    return CORES_INTERESSE[i % CORES_INTERESSE.length];
  }

  private salvar(dados: Partial<PreferenciasAluno> & { interesses?: string[] }): void {
    const atual = this.contexto.resumo();
    if (!atual) return;
    // Mostra a mudanca na hora; se o servidor recusar, volta ao que era.
    this.contexto.resumo.set({
      ...atual,
      preferencias: { ...atual.preferencias, ...dados },
      interesses: dados.interesses ?? atual.interesses,
    });
    this.erro.set('');
    this.service.salvarPreferencias(dados).subscribe({
      next: (res) => this.contexto.resumo.set(res.data),
      error: () => {
        this.contexto.resumo.set(atual);
        this.erro.set('Não foi possível salvar agora. Tente de novo.');
      },
    });
  }

  alternar(chave: Chave): void {
    const atual = this.contexto.resumo()?.preferencias[chave];
    this.salvar({ [chave]: !atual });
  }

  escolherMascote(id: Mascote): void {
    this.salvar({ mascote: id });
  }

  adicionarInteresse(): void {
    const texto = this.novoInteresse.trim();
    const lista = this.contexto.resumo()?.interesses ?? [];
    if (!texto) {
      this.adicionando.set(false);
      return;
    }
    if (lista.length >= 10) {
      this.erro.set('Você pode ter até 10 interesses.');
      return;
    }
    if (!lista.some((i) => i.toLowerCase() === texto.toLowerCase()))
      this.salvar({ interesses: [...lista, texto.slice(0, 40)] });
    this.novoInteresse = '';
    this.adicionando.set(false);
  }

  removerInteresse(item: string): void {
    const lista = this.contexto.resumo()?.interesses ?? [];
    this.salvar({ interesses: lista.filter((i) => i !== item) });
  }
}
