import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** "Avisar a professora" na tela Precisa de ajuda. */
@Entity('pedido_ajuda')
export class PedidoAjuda {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'aluno_id' })
  alunoId!: number;

  @Column({ name: 'tarefa_id' })
  tarefaId!: number;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  passo!: number | null;

  @Column({
    name: 'criado_em',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  criadoEm!: Date;

  @Column({ name: 'visto_em', type: 'datetime', nullable: true })
  vistoEm!: Date | null;

  /** Resposta da professora (o aluno ve na tarefa). */
  @Column({ type: 'text', nullable: true })
  resposta!: string | null;

  @Column({ name: 'respondido_em', type: 'datetime', nullable: true })
  respondidoEm!: Date | null;
}
