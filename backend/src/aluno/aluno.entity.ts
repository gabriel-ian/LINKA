import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Escola } from '../escola/escola.entity';

/**
 * Tabela `aluno`.
 * O aluno nao tem login proprio: o acesso acontece pelo responsavel
 * (tabela usuario, perfil = 'responsavel', ligado por aluno_responsavel).
 */
@Entity('aluno')
export class Aluno {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nome_completo' })
  nomeCompleto!: string;

  /**
   * String 'YYYY-MM-DD', nao Date: converter para Date faz a data
   * andar um dia por causa do fuso (UTC vs America/Sao_Paulo).
   */
  @Column({ type: 'date', nullable: true })
  data_nascimento!: string | null;

  /** Codigo Geral de Matricula da rede de ensino. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  cgm!: string | null;

  @Column({ name: 'escola_id' })
  escolaId!: number;

  @ManyToOne(() => Escola)
  @JoinColumn({ name: 'escola_id' })
  escola!: Escola;

  @Column({ default: false })
  neurodivergente!: boolean;

  /** Caminho/identificador do laudo anexado, quando houver. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  laudo!: string | null;

  @Column({ default: true })
  ativo!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  criado_em!: Date;
}
