import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Aluno } from '../aluno/aluno.entity';
import { Tarefa } from '../tarefa/tarefa.entity';

export type StatusTarefa = 'pendente' | 'concluida';

/**
 * Tabela `tarefa_status` — chave primaria composta (aluno_id, tarefa_id),
 * mesmo padrao de `matricula`. Guarda se um aluno concluiu uma tarefa e
 * quando. Sem esta tabela nao havia como o aluno (via responsavel)
 * acompanhar o proprio progresso (ver backend/sql/tarefa-status.sql).
 */
@Entity('tarefa_status')
export class TarefaStatusEntity {
  @PrimaryColumn({ name: 'aluno_id' })
  alunoId!: number;

  @PrimaryColumn({ name: 'tarefa_id' })
  tarefaId!: number;

  @Column({
    type: 'enum',
    enum: ['pendente', 'concluida'],
    default: 'pendente',
  })
  status!: StatusTarefa;

  @Column({ type: 'datetime', nullable: true })
  concluido_em!: Date | null;

  @ManyToOne(() => Aluno)
  @JoinColumn({ name: 'aluno_id' })
  aluno!: Aluno;

  @ManyToOne(() => Tarefa)
  @JoinColumn({ name: 'tarefa_id' })
  tarefa!: Tarefa;
}
