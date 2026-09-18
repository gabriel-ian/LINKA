import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Tabela `escola`.
 * Email e senha NAO ficam aqui: o login da escola vive em `usuario`
 * (perfil = 'escola', com escola_id apontando para este registro).
 */
@Entity('escola')
export class Escola {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cnpj!: string | null;

  @Column({ default: true })
  ativo!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  criado_em!: Date;
}
