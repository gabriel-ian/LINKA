import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Tabela `disciplina`. Catalogo global (nao tem escola_id): a mesma
 * disciplina (ex. "Matematica") e reaproveitada por qualquer escola.
 * Gerenciado pelo admin, assim como o CRUD de escolas.
 */
@Entity('disciplina')
export class Disciplina {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  nome!: string;
}
