import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Escola } from '../escola/escola.entity';

/** Tabela `turma`. Nao existe coluna `ativo` no banco. */
@Entity('turma')
export class Turma {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nome!: string | null;

  @Column({ name: 'escola_id', nullable: true })
  escolaId!: number | null;

  @ManyToOne(() => Escola, { nullable: true })
  @JoinColumn({ name: 'escola_id' })
  escola!: Escola | null;
}
