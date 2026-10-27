import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { TarefaResumoAluno } from '../model/painel-aluno.model';
import { AlunoOfflineService } from './aluno-offline.service';
import { AuthService } from './auth.service';
import { PainelAlunoService } from './painel-aluno.service';

const tarefa = (extra: Partial<TarefaResumoAluno> = {}): TarefaResumoAluno => ({
  id: 6,
  titulo: 'Frações',
  disciplina: 'Matemática',
  dataEntrega: null,
  horaLimite: null,
  situacao: 'pendente',
  passosFeitos: 0,
  totalPassos: 2,
  concluidoEm: null,
  ...extra,
});

describe('AlunoOfflineService', () => {
  let service: AlunoOfflineService;
  let concluirPasso: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    concluirPasso = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { usuarioId: 20 } },
        { provide: PainelAlunoService, useValue: { concluirPasso } },
      ],
    });
    service = TestBed.inject(AlunoOfflineService);
    service.iniciar();
  });

  afterEach(() => localStorage.clear());

  it('mostra os passos da fila como feitos, sem entregar a tarefa', () => {
    service.adicionar({ tarefaId: 6, passo: 1, feitoEm: 'a' });
    service.adicionar({ tarefaId: 6, passo: 2, feitoEm: 'b' });

    const t = service.aplicar(tarefa());
    expect(t.passosFeitos).toBe(2);
    // Entregar a tarefa e outro botao e precisa de internet.
    expect(t.situacao).toBe('em-andamento');
    expect(service.aguardandoEnvio(t)).toBe(false);
  });

  it('a fila sobrevive a um recarregamento da pagina', () => {
    service.adicionar({ tarefaId: 6, passo: 1, feitoEm: 'a' });
    service.fila.set([]);
    service.iniciar();
    expect(service.fila()).toEqual([{ tarefaId: 6, passo: 1, feitoEm: 'a' }]);
  });

  it('envia em ordem e esvazia a fila', async () => {
    concluirPasso.mockReturnValue(of({ data: {} }));
    service.adicionar({ tarefaId: 6, passo: 1, feitoEm: 'a' });
    service.adicionar({ tarefaId: 6, passo: 2, feitoEm: 'b' });

    await expect(service.enviar()).resolves.toBe(true);
    expect(concluirPasso.mock.calls).toEqual([
      [6, 1, 'a'],
      [6, 2, 'b'],
    ]);
    expect(service.fila()).toEqual([]);
  });

  it('sem internet no meio, guarda o que faltou para depois', async () => {
    concluirPasso
      .mockReturnValueOnce(of({ data: {} }))
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 504 })));
    service.adicionar({ tarefaId: 6, passo: 1, feitoEm: 'a' });
    service.adicionar({ tarefaId: 6, passo: 2, feitoEm: 'b' });

    await expect(service.enviar()).resolves.toBe(false);
    expect(service.fila()).toEqual([{ tarefaId: 6, passo: 2, feitoEm: 'b' }]);
  });

  it('descarta passo que o servidor ja tinha (400)', async () => {
    concluirPasso.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    service.adicionar({ tarefaId: 6, passo: 1, feitoEm: 'a' });

    await expect(service.enviar()).resolves.toBe(true);
    expect(service.fila()).toEqual([]);
  });
});
