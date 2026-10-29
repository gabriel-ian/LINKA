import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Mascote, PreferenciasAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { VelocidadeVoz, VozService } from '../../../core/services/voz.service';
import { AlunoContexto } from '../aluno-contexto';
import { MASCOTES, MascoteDesenho, infoMascote } from '../../../shared/mascote/mascote';

type Chave =
  | 'ouvirVoz'
  | 'passosCurtos'
  | 'fonteDislexia'
  | 'altoContraste'
  | 'reguaLeitura'
  | 'tempoPasso'
  | 'modoCalmo';

const CORES_INTERESSE = ['verde', 'azul', 'roxo', 'laranja'];

/** "Aluno - Meu perfil" do Figma. Cada mudanca e salva na hora. */
@Component({
  selector: 'app-aluno-perfil',
  imports: [FormsModule, MascoteDesenho],
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
    {
      chave: 'reguaLeitura',
      titulo: 'Régua de leitura',
      texto: 'Uma faixa destaca a linha que você está lendo',
    },
    {
      chave: 'tempoPasso',
      titulo: 'Relógio nos passos',
      texto: 'Mostra quanto tempo passou e lembra de fazer uma pausa',
    },
    { chave: 'modoCalmo', titulo: 'Modo calmo', texto: 'Menos cores e animações' },
  ];

  readonly tamanhos: { valor: 0 | 1 | 2 | 3; nome: string; amostra: number }[] = [
    { valor: 0, nome: 'Normal', amostra: 16 },
    { valor: 1, nome: 'Grande', amostra: 19 },
    { valor: 2, nome: 'Maior', amostra: 22 },
    { valor: 3, nome: 'Enorme', amostra: 26 },
  ];

  /** Nomes das ajudas sugeridas, para o aluno saber o que o interruptor liga. */
  nomesSugeridas(ligado: Partial<PreferenciasAluno>): string[] {
    const nomes: string[] = [];
    for (const [chave, valor] of Object.entries(ligado)) {
      if (chave === 'letrasMaiores') continue;
      if (chave === 'tamanhoLetra')
        nomes.push(`Letra ${this.tamanhos.find((t) => t.valor === valor)?.nome.toLowerCase()}`);
      else if (chave === 'ouvirVoz' && valor === false) nomes.push('Sem leitura em voz alta');
      else {
        const o = this.opcoes.find((x) => x.chave === chave);
        if (o) nomes.push(o.titulo);
      }
    }
    return nomes;
  }

  /** Todas as ajudas sugeridas estao como a escola indicou. */
  sugeridasLigadas(): boolean {
    const r = this.contexto.resumo();
    const ligado = r?.ajudasSugeridas?.ligado;
    if (!r || !ligado) return false;
    return Object.entries(ligado).every(
      ([c, v]) => (r.preferencias as unknown as Record<string, unknown>)[c] === v,
    );
  }

  alternarSugeridas(): void {
    const aj = this.contexto.resumo()?.ajudasSugeridas;
    if (aj) this.salvar(this.sugeridasLigadas() ? aj.desligado : aj.ligado);
  }

  escolherTamanho(valor: 0 | 1 | 2 | 3): void {
    this.salvar({ tamanhoLetra: valor, letrasMaiores: valor > 0 });
  }

  readonly voz = inject(VozService);
  readonly velocidades: { id: VelocidadeVoz; nome: string }[] = [
    { id: 'devagar', nome: 'Devagar' },
    { id: 'normal', nome: 'Normal' },
    { id: 'rapida', nome: 'Rápida' },
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
    return infoMascote(id);
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
    const info = infoMascote(id);
    this.testarVoz(`Oi! Agora eu sou ${info.nome === 'Coruja' ? 'a' : 'o'} ${info.nome}.`);
  }

  escolherVoz(nome: string): void {
    this.salvar({ voz: nome || null });
    this.testarVoz();
  }

  escolherVelocidade(v: VelocidadeVoz): void {
    this.salvar({ velocidadeVoz: v });
    this.testarVoz();
  }

  /** Fala com a voz, a velocidade e o tom que estao na tela agora. */
  testarVoz(texto?: string): void {
    const r = this.contexto.resumo();
    if (!r) return;
    const info = infoMascote(r.preferencias.mascote);
    this.voz.falar(
      texto ??
        `Oi, ${r.aluno.primeiroNome}! Eu sou ${info.nome === 'Coruja' ? 'a' : 'o'} ${info.nome}. Vamos aprender juntos?`,
      false,
      {
        voz: r.preferencias.voz ?? null,
        velocidade: r.preferencias.velocidadeVoz ?? 'normal',
        tom: info.tom,
      },
    );
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
