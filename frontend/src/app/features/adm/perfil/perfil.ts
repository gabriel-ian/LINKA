import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PerfilPagina } from '../../../shared/perfil-pagina/perfil-pagina';
import { EscolasStore } from '../escolas.store';

/** "Meu perfil" do ADM: acesso e um resumo das escolas da plataforma. */
@Component({
  selector: 'app-adm-perfil',
  imports: [PerfilPagina, RouterLink],
  template: `
    <app-perfil-pagina
      iniciais="AD"
      nome="Administração Linka"
      perfil="ADM"
      [email]="email"
      subtitulo="Seu acesso de administrador da plataforma"
    >
      <div class="perfil-blocos">
        <section class="cartao perfil-bloco">
          <h2>Acesso</h2>
          <dl class="perfil-dados">
            <dt>Tipo de acesso</dt>
            <dd>Administrador da plataforma</dd>
            <dt>E-mail de login</dt>
            <dd>{{ email ?? '—' }}</dd>
            <dt>O que você pode fazer</dt>
            <dd>Cadastrar, atualizar, desativar e reativar escolas</dd>
          </dl>
        </section>

        <section class="cartao perfil-bloco">
          <h2>Escolas na plataforma</h2>
          <div class="perfil-numeros">
            <div>
              <strong>{{ store.escolas().length }}</strong
              ><span>cadastradas</span>
            </div>
            <div>
              <strong>{{ store.ativas().length }}</strong
              ><span>ativas</span>
            </div>
            <div>
              <strong>{{ store.inativas().length }}</strong
              ><span>desativadas</span>
            </div>
          </div>
          <a class="link-acao" routerLink="/adm/escolas">Ver a lista de escolas</a>
        </section>
      </div>
    </app-perfil-pagina>
  `,
})
export class AdmPerfil {
  readonly store = inject(EscolasStore);
  readonly email = inject(AuthService).email;
}
