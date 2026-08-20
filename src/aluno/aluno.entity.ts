import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Escola } from '../escola/escola.entity';

@Entity('aluno')
export class Aluno {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({ type: 'date' })
  data_nascimento!: Date;

  @Column()
  email!: string;

  @Column()
  senha!: string;

  @Column({ default: true })
  ativo!: boolean;

  @ManyToOne(() => Escola)
  @JoinColumn({ name: 'escola_id' })
  escola!: Escola;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  criado_em!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  atualizado_em!: Date;
}