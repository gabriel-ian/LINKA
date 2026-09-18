import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Tabela `neurodivergencia`. Catalogo global (TDAH, TEA, Dislexia...),
 * gerenciado pelo admin. O vinculo com um aluno especifico fica em
 * `aluno_neurodivergencia`.
 */
@Entity('neurodivergencia')
export class Neurodivergencia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  nome!: string;
}
