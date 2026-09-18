import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Aluno } from '../aluno/aluno.entity';
import { Neurodivergencia } from '../neurodivergencia/neurodivergencia.entity';

/**
 * Tabela `aluno_neurodivergencia` — quais neurodivergencias um aluno tem.
 * Tem `id` proprio; a dedup de vinculo repetido e feita na aplicacao.
 */
@Entity('aluno_neurodivergencia')
export class AlunoNeurodivergencia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'aluno_id', nullable: true })
  alunoId!: number | null;

  @Column({ name: 'neurodivergencia_id', nullable: true })
  neurodivergenciaId!: number | null;

  @ManyToOne(() => Aluno, { nullable: true })
  @JoinColumn({ name: 'aluno_id' })
  aluno!: Aluno | null;

  @ManyToOne(() => Neurodivergencia, { nullable: true })
  @JoinColumn({ name: 'neurodivergencia_id' })
  neurodivergencia!: Neurodivergencia | null;
}
