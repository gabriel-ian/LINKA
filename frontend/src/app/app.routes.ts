import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { perfilGuard } from './core/guards/perfil-guard';
import { visitanteGuard } from './core/guards/visitante-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [visitanteGuard],
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'adm/login',
    canActivate: [visitanteGuard],
    loadComponent: () =>
      import('./features/adm-login/adm-login').then((m) => m.AdmLogin),
  },
  {
    path: 'recuperar-senha',
    canActivate: [visitanteGuard],
    loadComponent: () =>
      import('./features/recuperar-senha/recuperar-senha').then((m) => m.RecuperarSenha),
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
    path: 'inicio',
    canActivate: [authGuard, perfilGuard('aluno', 'responsavel')],
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
  },
  { path: 'dashboard', redirectTo: 'inicio', pathMatch: 'full' },
  {
    path: 'escola',
    canActivate: [authGuard, perfilGuard('escola')],
    loadComponent: () => import('./features/escola/escola-layout').then((m) => m.EscolaLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/escola/painel/painel').then((m) => m.EscolaPainel),
      },
      {
        path: 'turmas',
        loadComponent: () => import('./features/escola/turmas/turmas').then((m) => m.EscolaTurmas),
      },
      {
        path: 'turmas/nova',
        loadComponent: () =>
          import('./features/escola/turma-nova/turma-nova').then((m) => m.EscolaTurmaNova),
      },
      {
        path: 'turmas/:id/editar',
        loadComponent: () =>
          import('./features/escola/turma-nova/turma-nova').then((m) => m.EscolaTurmaNova),
      },
      {
        path: 'turmas/:id',
        loadComponent: () =>
          import('./features/escola/turma-detalhe/turma-detalhe').then((m) => m.EscolaTurmaDetalhe),
      },
      {
        path: 'professores',
        loadComponent: () =>
          import('./features/escola/professores/professores').then((m) => m.EscolaProfessores),
      },
      {
        path: 'alunos',
        loadComponent: () => import('./features/escola/alunos/alunos').then((m) => m.EscolaAlunos),
      },
      {
        path: 'alunos/:id/editar',
        loadComponent: () =>
          import('./features/escola/aluno-editar/aluno-editar').then((m) => m.EscolaAlunoEditar),
      },
      {
        path: 'alunos/:id',
        loadComponent: () =>
          import('./features/escola/aluno-perfil/aluno-perfil').then((m) => m.EscolaAlunoPerfil),
      },
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./features/escola/relatorios/relatorios').then((m) => m.EscolaRelatorios),
      },
      {
        path: 'cadastro/professor',
        loadComponent: () =>
          import('./features/escola/cadastro-professor/cadastro-professor').then(
            (m) => m.EscolaCadastroProfessor,
          ),
      },
      {
        path: 'cadastro/aluno',
        loadComponent: () =>
          import('./features/escola/cadastro-aluno/cadastro-aluno').then((m) => m.EscolaCadastroAluno),
      },
    ],
  },
  {
    path: 'professor',
    canActivate: [authGuard, perfilGuard('professor')],
    loadComponent: () =>
      import('./features/professor/professor-layout').then((m) => m.ProfessorLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/professor/visao/visao').then((m) => m.ProfessorVisao),
      },
      {
        path: 'tarefas',
        loadComponent: () => import('./features/professor/tarefas/tarefas').then((m) => m.ProfessorTarefas),
      },
      {
        path: 'tarefas/nova',
        loadComponent: () =>
          import('./features/professor/tarefa-nova/tarefa-nova').then((m) => m.ProfessorTarefaNova),
      },
      {
        path: 'tarefas/:id',
        loadComponent: () => import('./features/professor/tarefa/tarefa').then((m) => m.ProfessorTarefa),
      },
      {
        path: 'turmas/:id',
        loadComponent: () => import('./features/professor/turma/turma').then((m) => m.ProfessorTurma),
      },
      {
        path: 'alunos/:id',
        loadComponent: () => import('./features/professor/aluno/aluno').then((m) => m.ProfessorAluno),
      },
      {
        path: 'comunicados',
        loadComponent: () =>
          import('./features/professor/comunicados/comunicados').then((m) => m.ProfessorComunicados),
      },
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./features/professor/relatorios/relatorios').then((m) => m.ProfessorRelatorios),
      },
    ],
  },
  // Endereco antigo do painel provisorio da escola.
  { path: 'escolas', redirectTo: 'escola', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
