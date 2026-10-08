import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Escola } from '../escola/escola.entity';
import { Usuario } from '../usuario/usuario.entity';

/**
 * Tabela `professor`.
 * Email e senha ficam no `usuario` vinculado por usuario_id.
 */
@Entity('professor')
export class Professor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'nome_completo',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nomeCompleto!: string | null;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId!: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario | null;

  @Column({ name: 'escola_id', nullable: true })
  escolaId!: number | null;

  @ManyToOne(() => Escola, { nullable: true })
  @JoinColumn({ name: 'escola_id' })
  escola!: Escola | null;
}
