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
 * Tabela `aluno`.
 * O login do aluno e opcional (usuario perfil 'aluno', via usuario_id);
 * a familia acompanha pelo responsavel (aluno_responsavel).
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

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId!: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario | null;

  @Column({ default: false })
  neurodivergente!: boolean;

  /** Nome do arquivo do laudo em uploads/laudos (nunca exposto direto). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  laudo!: string | null;

  @Column({ name: 'laudo_enviado_em', type: 'datetime', nullable: true })
  laudoEnviadoEm!: Date | null;

  /** Perfil de aprendizagem, preenchido pela escola/professor. */
  @Column({ type: 'text', nullable: true })
  dificuldades!: string | null;

  @Column({ name: 'pontos_fortes', type: 'text', nullable: true })
  pontosFortes!: string | null;

  /** Separados por virgula: "Dinossauros, Futebol". */
  @Column({ type: 'varchar', length: 255, nullable: true })
  interesses!: string | null;

  @Column({ default: true })
  ativo!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  criado_em!: Date;
}
