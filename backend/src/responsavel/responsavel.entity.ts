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
 * Nao tem escola_id: o responsavel pode acompanhar alunos de escolas
 * diferentes; o escopo de acesso vem de `aluno_responsavel`.
 */
@Entity('responsavel')
export class Responsavel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nome_completo', type: 'varchar', length: 255, nullable: true })
  nomeCompleto!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone!: string | null;

  /** Ex.: "Mãe", "Pai", "Avó". */
  @Column({ type: 'varchar', length: 30, nullable: true })
  parentesco!: string | null;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId!: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario | null;
}
