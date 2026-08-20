import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Escola } from '../escola/escola.entity';

@Entity('professor')
export class Professor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column()
  email!: string;

  @Column({ default: true })
  ativo!: boolean;

  @ManyToOne(() => Escola)
  @JoinColumn({ name: 'escola_id' })
  escola!: Escola;
}