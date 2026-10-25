import { Component, computed, inject } from '@angular/core';
import { PerfilPagina } from '../../../shared/perfil-pagina/perfil-pagina';
import { dataBr, iniciais, ROTULO_PLANO } from '../../adm/escola-ui';
import { EscolaContexto } from '../escola-contexto';

/** "Meu perfil" da escola: dados da instituicao, coordenacao, plano e numeros. */
@Component({
  selector: 'app-escola-perfil',
  imports: [PerfilPagina],
  template: `
    @if (contexto.escola(); as e) {
      <app-perfil-pagina
        [iniciais]="sigla()"
        [nome]="e.nome"
        perfil="Escola"
        [email]="e.email"
        subtitulo="Dados da escola na Linka"
      >
        <div class="perfil-blocos">
          <section class="cartao perfil-bloco">
            <h2>Dados da escola</h2>
            <dl class="perfil-dados">
              <dt>Nome</dt>
              <dd>{{ e.nome }}</dd>
              <dt>Código INEP</dt>
              <dd>{{ e.inep || '—' }}</dd>
              @if (e.cnpj) {
                <dt>CNPJ</dt>
                <dd>{{ e.cnpj }}</dd>
              }
              <dt>Endereço</dt>
              <dd>{{ e.endereco || '—' }}</dd>
              <dt>Cidade / UF</dt>
              <dd>{{ cidade() || '—' }}</dd>
              <dt>Telefone</dt>
              <dd>{{ e.telefone || '—' }}</dd>
            </dl>
          </section>

          <section class="cartao perfil-bloco">
            <h2>Coordenação e plano</h2>
            <dl class="perfil-dados">
              <dt>Responsável</dt>
              <dd>{{ e.responsavel || '—' }}</dd>
              <dt>E-mail de login</dt>
              <dd>{{ e.email || '—' }}</dd>
              <dt>Plano</dt>
              <dd>{{ plano() }}</dd>
              <dt>Situação</dt>
              <dd>{{ e.ativo ? 'Ativa' : 'Desativada' }}</dd>
              <dt>Na Linka desde</dt>
              <dd>{{ data(e.criado_em) }}</dd>
            </dl>
          </section>

          <section class="cartao perfil-bloco">
            <h2>Números da escola</h2>
            <div class="perfil-numeros">
              <div>
                <strong>{{ e.totalTurmas }}</strong
                ><span>turmas</span>
              </div>
              <div>
                <strong>{{ contexto.professores().length }}</strong
                ><span>professores</span>
              </div>
              <div>
                <strong>{{ contexto.alunos().length }}</strong
                ><span>alunos</span>
              </div>
              <div>
                <strong>{{ e.totalAlunosNee }}</strong
                ><span>alunos NEE</span>
              </div>
            </div>
            <dl class="perfil-dados">
              <dt>Limite de professores</dt>
              <dd>{{ e.limiteProfessores ?? 'Sem limite' }}</dd>
              <dt>Limite de alunos NEE</dt>
              <dd>{{ e.limiteAlunosNee ?? 'Sem limite' }}</dd>
            </dl>
            <p class="ajuda">Para mudar os dados da escola ou o plano, fale com a equipe Linka.</p>
          </section>
        </div>
      </app-perfil-pagina>
    } @else {
      <p>Carregando...</p>
    }
  `,
})
export class EscolaPerfil {
  readonly contexto = inject(EscolaContexto);
  readonly data = dataBr;

  readonly sigla = computed(() => iniciais(this.contexto.escola()?.nome ?? 'Escola'));
  readonly plano = computed(() => {
    const e = this.contexto.escola();
    return e ? ROTULO_PLANO[e.plano] : '';
  });
  readonly cidade = computed(() => {
    const e = this.contexto.escola();
    return [e?.cidade, e?.uf].filter(Boolean).join(' - ');
  });
}
