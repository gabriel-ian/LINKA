import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { perfilGuard } from './core/guards/perfil-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'adm/login',
    loadComponent: () =>
      import('./features/adm-login/adm-login').then((m) => m.AdmLogin),
  },
  {
    path: 'recuperar-senha',
    loadComponent: () =>
      import('./features/recuperar-senha/recuperar-senha').then((m) => m.RecuperarSenha),
  },
  {
    path: 'recuperar-senha/enviado',
    loadComponent: () =>
      import('./features/recuperar-senha/email-enviado').then((m) => m.EmailEnviado),
  },
  {
    path: 'adm',
    canActivate: [authGuard, perfilGuard('admin')],
    loadComponent: () =>
      import('./features/adm/adm-layout/adm-layout').then((m) => m.AdmLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/adm/visao-geral/visao-geral').then((m) => m.VisaoGeral),
      },
      {
        path: 'escolas',
        loadComponent: () =>
          import('./features/adm/escolas-lista/escolas-lista').then((m) => m.EscolasLista),
      },
      {
        path: 'escolas/cadastrar',
        data: { modo: 'cadastrar' },
        loadComponent: () =>
          import('./features/adm/escola-form/escola-form').then((m) => m.EscolaForm),
      },
      {
        path: 'escolas/buscar',
        loadComponent: () =>
          import('./features/adm/buscar-escola/buscar-escola').then((m) => m.BuscarEscola),
      },
      {
        path: 'escolas/id',
        loadComponent: () =>
          import('./features/adm/buscar-id/buscar-id').then((m) => m.BuscarId),
      },
      {
        path: 'escolas/atualizar',
        data: { modo: 'atualizar' },
        loadComponent: () =>
          import('./features/adm/escola-form/escola-form').then((m) => m.EscolaForm),
      },
      {
        path: 'escolas/desativar',
        loadComponent: () =>
          import('./features/adm/desativar-escola/desativar-escola').then(
            (m) => m.DesativarEscola,
          ),
      },
      {
        path: 'escolas/reativar',
        loadComponent: () =>
          import('./features/adm/reativar-escola/reativar-escola').then(
            (m) => m.ReativarEscola,
          ),
      },
    ],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },
  {
    path: 'escolas',
    loadComponent: () =>
      import('./features/escola/escola-list').then((m) => m.EscolaList),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];
