import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Aluno } from '../aluno/aluno.entity';
import { Turma } from '../turma/turma.entity';

/**
 * Tabela `matricula` — tabela de juncao com chave primaria composta
 * (aluno_id, turma_id). Nao existe coluna `id` nem `data_matricula`.
 * A PK composta ja impede matricula duplicada no proprio banco.
 */
@Entity('matricula')
export class Matricula {
  @PrimaryColumn({ name: 'aluno_id' })
  alunoId!: number;

  @PrimaryColumn({ name: 'turma_id' })
  turmaId!: number;

  @ManyToOne(() => Aluno)
  @JoinColumn({ name: 'aluno_id' })
  aluno!: Aluno;

  @ManyToOne(() => Turma)
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma;
}
