import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { perfilGuard } from './core/guards/perfil-guard';
import { visitanteGuard } from './core/guards/visitante-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'adm/login',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./features/adm-login/adm-login').then((m) => m.AdmLogin),
  },
  {
    path: 'recuperar-senha',
    canActivate: [visitanteGuard],
    loadComponent: () =>
      import('./features/recuperar-senha/recuperar-senha').then((m) => m.RecuperarSenha),
  },
  {
    path: 'privacidade',
    loadComponent: () => import('./features/privacidade/privacidade').then((m) => m.Privacidade),
  },
  {
    // Link do e-mail de nova senha: sem guard, abre mesmo com alguem logado.
    path: 'redefinir-senha',
    loadComponent: () =>
      import('./features/redefinir-senha/redefinir-senha').then((m) => m.RedefinirSenha),
  },
  {
    path: 'adm',
    canActivate: [authGuard, perfilGuard('admin')],
    loadComponent: () => import('./features/adm/adm-layout/adm-layout').then((m) => m.AdmLayout),
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
        loadComponent: () => import('./features/adm/buscar-id/buscar-id').then((m) => m.BuscarId),
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
          import('./features/adm/desativar-escola/desativar-escola').then((m) => m.DesativarEscola),
      },
      {
        path: 'escolas/reativar',
        loadComponent: () =>
          import('./features/adm/reativar-escola/reativar-escola').then((m) => m.ReativarEscola),
      },
    ],
  },
  {
    path: 'primeiro-acesso',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/primeiro-acesso/primeiro-acesso').then((m) => m.PrimeiroAcesso),
  },
  {
    path: 'aluno',
    canActivate: [authGuard, perfilGuard('aluno')],
    loadComponent: () => import('./features/aluno/aluno-layout').then((m) => m.AlunoLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/aluno/inicio/inicio').then((m) => m.AlunoInicio),
      },
      {
        path: 'tarefas',
        loadComponent: () => import('./features/aluno/tarefas/tarefas').then((m) => m.AlunoTarefas),
      },
      {
        path: 'tarefas/:id/ajuda',
        loadComponent: () => import('./features/aluno/ajuda/ajuda').then((m) => m.AlunoAjuda),
      },
      {
        path: 'tarefas/:id/concluida',
        loadComponent: () =>
          import('./features/aluno/concluida/concluida').then((m) => m.AlunoConcluida),
      },
      {
        path: 'tarefas/:id',
        loadComponent: () => import('./features/aluno/tarefa/tarefa').then((m) => m.AlunoTarefa),
      },
      {
        path: 'avisos',
        loadComponent: () => import('./features/aluno/avisos/avisos').then((m) => m.AlunoAvisos),
      },
      {
        path: 'progresso',
        loadComponent: () =>
          import('./features/aluno/progresso/progresso').then((m) => m.AlunoProgresso),
      },
      {
        path: 'conquistas',
        loadComponent: () =>
          import('./features/aluno/conquistas/conquistas').then((m) => m.AlunoConquistas),
      },
      {
        path: 'agenda',
        loadComponent: () => import('./features/aluno/agenda/agenda').then((m) => m.AlunoAgenda),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/aluno/perfil/perfil').then((m) => m.AlunoPerfil),
      },
    ],
  },
  {
    path: 'familia',
    canActivate: [authGuard, perfilGuard('responsavel')],
    loadComponent: () => import('./features/familia/familia-layout').then((m) => m.FamiliaLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/familia/painel/painel').then((m) => m.FamiliaPainel),
      },
      {
        path: 'incentivo',
        loadComponent: () =>
          import('./features/familia/incentivo/incentivo').then((m) => m.FamiliaIncentivo),
      },
      {
        path: 'tarefas',
        loadComponent: () =>
          import('./features/familia/tarefas/tarefas').then((m) => m.FamiliaTarefas),
      },
      {
        path: 'avisos',
        loadComponent: () =>
          import('./features/familia/avisos/avisos').then((m) => m.FamiliaAvisos),
      },
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./features/familia/relatorios/relatorios').then((m) => m.FamiliaRelatorios),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./features/familia/configuracoes/configuracoes').then(
            (m) => m.FamiliaConfiguracoes,
          ),
      },
    ],
  },
  // Enderecos antigos da pagina provisoria da familia.
  { path: 'inicio', redirectTo: 'familia', pathMatch: 'full' },
  { path: 'dashboard', redirectTo: 'familia', pathMatch: 'full' },
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
        path: 'turmas/virada',
        loadComponent: () => import('./features/escola/virada/virada').then((m) => m.EscolaVirada),
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
        path: 'professores/:id/editar',
        loadComponent: () =>
          import('./features/escola/professor-editar/professor-editar').then(
            (m) => m.EscolaProfessorEditar,
          ),
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
        path: 'familias',
        loadComponent: () =>
          import('./features/escola/familias/familias').then((m) => m.EscolaFamilias),
      },
      {
        path: 'cadastro/familia',
        loadComponent: () =>
          import('./features/escola/cadastro-familia/cadastro-familia').then(
            (m) => m.EscolaCadastroFamilia,
          ),
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
          import('./features/escola/cadastro-aluno/cadastro-aluno').then(
            (m) => m.EscolaCadastroAluno,
          ),
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
        loadComponent: () =>
          import('./features/professor/visao/visao').then((m) => m.ProfessorVisao),
      },
      {
        path: 'tarefas',
        loadComponent: () =>
          import('./features/professor/tarefas/tarefas').then((m) => m.ProfessorTarefas),
      },
      {
        path: 'tarefas/nova',
        loadComponent: () =>
          import('./features/professor/tarefa-nova/tarefa-nova').then((m) => m.ProfessorTarefaNova),
      },
      {
        path: 'tarefas/:id/editar',
        loadComponent: () =>
          import('./features/professor/tarefa-nova/tarefa-nova').then((m) => m.ProfessorTarefaNova),
      },
      {
        path: 'tarefas/:id',
        loadComponent: () =>
          import('./features/professor/tarefa/tarefa').then((m) => m.ProfessorTarefa),
      },
      {
        path: 'turmas/:id',
        loadComponent: () =>
          import('./features/professor/turma/turma').then((m) => m.ProfessorTurma),
      },
      {
        path: 'alunos/:id',
        loadComponent: () =>
          import('./features/professor/aluno/aluno').then((m) => m.ProfessorAluno),
      },
      {
        path: 'comunicados',
        loadComponent: () =>
          import('./features/professor/comunicados/comunicados').then(
            (m) => m.ProfessorComunicados,
          ),
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
