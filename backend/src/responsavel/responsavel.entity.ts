import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';

/**
 * Tabela `responsavel`. Email e senha ficam no `usuario` vinculado por
 * usuario_id (perfil = 'responsavel'), mesmo padrao do `professor`.
 * escola_id e a escola que cadastrou a familia (para ela achar a familia
 * antes de ter filho vinculado). O acesso continua vindo de
 * `aluno_responsavel`: o responsavel pode ter filhos em outra escola.
 */
@Entity('responsavel')
export class Responsavel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'nome_completo',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nomeCompleto!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone!: string | null;

  /** Ex.: "Mãe", "Pai", "Avó". */
  @Column({ type: 'varchar', length: 30, nullable: true })
  parentesco!: string | null;

  /** Avisos escolhidos em "Configuracoes" (painel da familia). */
  @Column({ type: 'json', nullable: true })
  preferencias!: Record<string, unknown> | null;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId!: number | null;

  @Column({ name: 'escola_id', type: 'int', unsigned: true, nullable: true })
  escolaId!: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario | null;
}
