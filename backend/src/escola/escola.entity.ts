import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type PlanoEscola = 'basico' | 'institucional';

/**
 * Tabela `escola`.
 * Email e senha NAO ficam aqui: o login da escola vive em `usuario`
 * (perfil = 'escola', com escola_id apontando para este registro).
 * Colunas de detalhe vem de sql/escola-detalhes.sql.
 */
@Entity('escola')
export class Escola {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cnpj!: string | null;

  /** Codigo INEP (8 digitos). */
  @Column({ type: 'char', length: 8, nullable: true })
  inep!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  endereco!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  cidade!: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  uf!: string | null;

  /** Nome de quem coordena a escola na Linka. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  responsavel!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone!: string | null;

  @Column({
    type: 'enum',
    enum: ['basico', 'institucional'],
    default: 'basico',
  })
  plano!: PlanoEscola;

  @Column({
    name: 'limite_professores',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  limiteProfessores!: number | null;

  @Column({
    name: 'limite_alunos_nee',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  limiteAlunosNee!: number | null;

  @Column({ default: true })
  ativo!: boolean;

  @Column({ name: 'desativada_em', type: 'date', nullable: true })
  desativadaEm!: string | null;

  @Column({
    name: 'motivo_desativacao',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  motivoDesativacao!: string | null;

  @Column({ name: 'observacao_desativacao', type: 'text', nullable: true })
  observacaoDesativacao!: string | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  criado_em!: Date;

  @Column({ name: 'atualizado_em', type: 'datetime', nullable: true })
  atualizadoEm!: Date | null;

  /** E-mail do admin que fez a ultima alteracao. */
  @Column({
    name: 'atualizado_por',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  atualizadoPor!: string | null;
}
