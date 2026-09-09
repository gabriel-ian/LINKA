import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Aluno } from '../aluno/aluno.entity';
import { Turma } from '../turma/turma.entity';

@Entity('matricula')
export class Matricula {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Aluno)
  @JoinColumn({ name: 'aluno_id' })
  aluno!: Aluno;

  @ManyToOne(() => Turma)
  @JoinColumn({ name: 'turma_id' })
  turma!: Turma;

  @CreateDateColumn()
  data_matricula!: Date;
}