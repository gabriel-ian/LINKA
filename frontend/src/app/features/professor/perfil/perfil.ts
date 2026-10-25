import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PerfilProfessor } from '../../../core/model/painel-professor.model';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import { PerfilPagina } from '../../../shared/perfil-pagina/perfil-pagina';
import { iniciais } from '../../adm/escola-ui';

/** "Meu perfil" do professor: dados, disciplinas e o que da em cada turma. */
@Component({
  selector: 'app-professor-perfil',
  imports: [PerfilPagina, RouterLink, DatePipe],
  template: `
    @if (erro()) {
      <p class="alerta-erro" role="alert">{{ erro() }}</p>
    }
    @if (dados(); as d) {
      <app-perfil-pagina
        [iniciais]="sigla(d.nome)"
        [nome]="d.nome"
        perfil="Professor(a)"
        [email]="d.email"
        [subtitulo]="d.escola"
      >
        <div class="perfil-blocos">
          <section class="cartao perfil-bloco">
            <h2>Meus dados</h2>
            <dl class="perfil-dados">
              <dt>Nome</dt>
              <dd>{{ d.nome }}</dd>
              <dt>E-mail de login</dt>
              <dd>{{ d.email || '—' }}</dd>
              <dt>Escola</dt>
              <dd>{{ d.escola }}</dd>
              <dt>Último acesso</dt>
              <dd>{{ d.ultimoAcesso ? (d.ultimoAcesso | date: "dd/MM/yyyy 'às' HH:mm") : '—' }}</dd>
            </dl>
          </section>

          <section class="cartao perfil-bloco">
            <h2>Disciplinas</h2>
            <div class="perfil-chips">
              @for (disc of d.disciplinas; track disc) {
                <span>{{ disc }}</span>
              } @empty {
                <p class="ajuda">Nenhuma disciplina cadastrada.</p>
              }
            </div>
            <div class="perfil-numeros">
              <div>
                <strong>{{ d.turmas.length }}</strong
                ><span>turmas</span>
              </div>
              <div>
                <strong>{{ totalAlunos() }}</strong
                ><span>alunos</span>
              </div>
              <div>
                <strong>{{ totalNee() }}</strong
                ><span>alunos NEE</span>
              </div>
            </div>
          </section>
        </div>

        <section class="cartao perfil-bloco">
          <h2>Minhas turmas</h2>
          <ul class="perfil-lista">
            @for (t of d.turmas; track t.id) {
              <li>
                <div>
                  <strong>{{ t.nome }}</strong>
                  <br />
                  <small>{{ t.disciplinas.join(', ') || 'Sem disciplina definida' }}</small>
                </div>
                <small
                  >{{ t.alunos === 1 ? '1 aluno' : t.alunos + ' alunos' }} · {{ t.nee }} NEE</small
                >
                <a class="link-acao" [routerLink]="['/professor/turmas', t.id]">Ver turma</a>
              </li>
            } @empty {
              <li>Nenhuma turma por enquanto. A coordenação vincula as turmas.</li>
            }
          </ul>
        </section>
      </app-perfil-pagina>
    }
  `,
})
export class ProfessorPerfil {
  private service = inject(PainelProfessorService);
  readonly dados = signal<PerfilProfessor | null>(null);
  readonly erro = signal('');
  readonly sigla = iniciais;

  readonly totalAlunos = () => this.dados()?.turmas.reduce((n, t) => n + t.alunos, 0) ?? 0;
  readonly totalNee = () => this.dados()?.turmas.reduce((n, t) => n + t.nee, 0) ?? 0;

  constructor() {
    this.service.perfil().subscribe({
      next: (res) => this.dados.set(res.data),
      error: () => this.erro.set('Não foi possível carregar o seu perfil agora.'),
    });
  }
}
