import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Escola } from '../escola/escola.entity';

export type PerfilUsuario = 'admin' | 'escola' | 'professor' | 'responsavel';

/**
 * Tabela `usuario` — centraliza o login de todos os perfis.
 * Aluno NAO loga: o enum do banco so tem admin, escola, professor e responsavel.
 */
@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  /** Hash bcrypt. Nunca guardar senha em texto puro. */
  @Column()
  senha!: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'escola', 'professor', 'responsavel'],
  })
  perfil!: PerfilUsuario;

  /** Null para admin da Linka, que nao pertence a nenhuma escola. */
  @Column({ name: 'escola_id', nullable: true })
  escolaId!: number | null;

  @ManyToOne(() => Escola, { nullable: true })
  @JoinColumn({ name: 'escola_id' })
  escola!: Escola | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  criado_em!: Date;

  /** Null ate o primeiro login: a escola aparece como "Pendente" no ADM. */
  @Column({ name: 'ultimo_login', type: 'datetime', nullable: true })
  ultimoLogin!: Date | null;
}
