import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Tabela `disciplina`. escola_id NULL = disciplina padrao, vista por todas
 * as escolas (Portugues, Matematica...). Com escola_id = criada por uma
 * escola (ex.: "Xadrez") e so ela ve e usa.
 */
@Entity('disciplina')
export class Disciplina {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  nome!: string;

  @Column({ name: 'escola_id', type: 'bigint', nullable: true })
  escolaId!: number | null;
}

/** Disciplinas que a escola enxerga: as padrao e as dela. */
export const DISCIPLINA_DA_ESCOLA = '(escola_id IS NULL OR escola_id = ?)';
