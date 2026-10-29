import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PerfilPagina } from '../../../shared/perfil-pagina/perfil-pagina';
import { FamiliaContexto } from '../familia-contexto';
import { Esqueleto } from '../../../shared/esqueleto/esqueleto';

/** "Meu perfil" da familia: dados do responsavel e os filhos vinculados. */
@Component({
  selector: 'app-familia-perfil',
  imports: [Esqueleto, PerfilPagina, RouterLink],
  template: `
    @if (contexto.dados(); as d) {
      <app-perfil-pagina
        [iniciais]="d.responsavel.iniciais"
        [nome]="d.responsavel.nome"
        perfil="Família"
        [email]="d.responsavel.email"
        subtitulo="Seus dados e os filhos que você acompanha"
      >
        <div class="perfil-blocos">
          <section class="cartao perfil-bloco">
            <h2>Meus dados</h2>
            <dl class="perfil-dados">
              <dt>Nome</dt>
              <dd>{{ d.responsavel.nome }}</dd>
              <dt>Parentesco</dt>
              <dd>{{ d.responsavel.parentesco || '—' }}</dd>
              <dt>E-mail de login</dt>
              <dd>{{ d.responsavel.email || '—' }}</dd>
              <dt>Telefone</dt>
              <dd>{{ d.responsavel.telefone || '—' }}</dd>
            </dl>
            <p class="nota-escola">🔒 Para mudar nome, e-mail ou telefone, fale com a escola.</p>
            <a class="link-acao" routerLink="/familia/configuracoes"
              >Avisos e dados (LGPD) em Configurações</a
            >
          </section>

          <section class="cartao perfil-bloco">
            <h2>{{ d.filhos.length === 1 ? 'Filho(a) vinculado(a)' : 'Filhos vinculados' }}</h2>
            <ul class="perfil-lista">
              @for (f of d.filhos; track f.id) {
                <li>
                  <div>
                    <strong>{{ f.nome }}</strong>
                    <br />
                    <small>{{ f.turma || 'Sem turma' }} · {{ f.escola }}</small>
                  </div>
                  <button type="button" class="link-acao" (click)="verPainel(f.id)">
                    Ver painel
                  </button>
                </li>
              } @empty {
                <li>Nenhum filho vinculado. Fale com a escola.</li>
              }
            </ul>
          </section>
        </div>
      </app-perfil-pagina>
    } @else {
      <app-esqueleto tipo="pagina" [linhas]="3" rotulo="Carregando o perfil..." />
    }
  `,
})
export class FamiliaPerfil {
  readonly contexto = inject(FamiliaContexto);
  private router = inject(Router);

  /** Escolhe o filho e abre o painel dele. */
  verPainel(id: number): void {
    this.contexto.selecionar(id);
    void this.router.navigate(['/familia']);
  }
}
