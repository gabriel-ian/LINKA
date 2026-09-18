import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Turma } from '../turma/turma.entity';
import { Professor } from '../professor/professor.entity';
import { Disciplina } from '../disciplina/disciplina.entity';

/**
 * Tabela `turma_professor_disciplina` — a grade: qual professor da
 * qual disciplina em qual turma. Tem `id` proprio (nao e PK composta),
 * entao a dedup de vinculo repetido e feita na aplicacao, nao pelo banco.
 */
@Entity('turma_professor_disciplina')
export class TurmaProfessorDisciplina {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'turma_id', nullable: true })
  turmaId!: number | null;

  @Column({ name: 'professor_id', nullable: true })
  professorId!: number | null;

  @Column({ name: 'disciplina_id', nullable: true })
  disciplinaId!: number | null;

  @ManyToOne(() => Turma, { nullable: true })
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma | null;

  @ManyToOne(() => Professor, { nullable: true })
  @JoinColumn({ name: 'professor_id' })
  professor!: Professor | null;

  @ManyToOne(() => Disciplina, { nullable: true })
  @JoinColumn({ name: 'disciplina_id' })
  disciplina!: Disciplina | null;
}
