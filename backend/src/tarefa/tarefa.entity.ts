import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Turma } from '../turma/turma.entity';
import { Disciplina } from '../disciplina/disciplina.entity';
import { Professor } from '../professor/professor.entity';

/** Tabela `tarefa`. Uma tarefa/atividade que um professor atribui a uma
 * turma, numa disciplina especifica. */
@Entity('tarefa')
export class Tarefa {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text', nullable: true })
  descricao!: string | null;

  /** String 'YYYY-MM-DD', mesmo motivo de aluno.data_nascimento: evitar
   * o deslocamento de um dia por fuso ao converter para Date. */
  @Column({ type: 'date', nullable: true })
  data_entrega!: string | null;

  @Column({ type: 'time', nullable: true })
  hora_limite!: string | null;

  @Column({ name: 'turma_id', nullable: true })
  turmaId!: number | null;

  @Column({ name: 'disciplina_id', nullable: true })
  disciplinaId!: number | null;

  @Column({ name: 'professor_id', nullable: true })
  professorId!: number | null;

  @ManyToOne(() => Turma, { nullable: true })
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma | null;

  @ManyToOne(() => Disciplina, { nullable: true })
  @JoinColumn({ name: 'disciplina_id' })
  disciplina!: Disciplina | null;

  @ManyToOne(() => Professor, { nullable: true })
  @JoinColumn({ name: 'professor_id' })
  professor!: Professor | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  criado_em!: Date;
}
