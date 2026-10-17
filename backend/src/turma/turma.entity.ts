import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Escola } from '../escola/escola.entity';

export type TurnoTurma = 'manha' | 'tarde' | 'noite' | 'integral';

/**
 * Tabela `turma`. Nao existe coluna `ativo` no banco.
 * `nome` continua sendo o nome exibido ("8º Ano A"); serie e letra
 * vem de sql/painel-escola.sql e podem ser nulas em turmas antigas.
 */
@Entity('turma')
export class Turma {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nome!: string | null;

  /** Ex.: "8º Ano". */
  @Column({ type: 'varchar', length: 20, nullable: true })
  serie!: string | null;

  /** Ex.: "A". */
  @Column({ type: 'varchar', length: 5, nullable: true })
  letra!: string | null;

  @Column({
    type: 'enum',
    enum: ['manha', 'tarde', 'noite', 'integral'],
    nullable: true,
  })
  turno!: TurnoTurma | null;

  @Column({
    name: 'ano_letivo',
    type: 'smallint',
    unsigned: true,
    nullable: true,
  })
  anoLetivo!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sala!: string | null;

  @Column({
    name: 'limite_alunos',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  limiteAlunos!: number | null;

  @Column({ name: 'escola_id', nullable: true })
  escolaId!: number | null;

  @ManyToOne(() => Escola, { nullable: true })
  @JoinColumn({ name: 'escola_id' })
  escola!: Escola | null;

  @Column({
    name: 'criado_em',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  criadoEm!: Date;
}
