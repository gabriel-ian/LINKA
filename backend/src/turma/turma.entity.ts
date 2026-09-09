import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Escola } from '../escola/escola.entity';

@Entity('turma')
export class Turma {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({ default: true })
  ativo!: boolean;

  @ManyToOne(() => Escola)
  @JoinColumn({ name: 'escola_id' })
  escola!: Escola;
}