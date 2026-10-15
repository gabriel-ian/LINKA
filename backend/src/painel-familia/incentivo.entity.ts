import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** "Enviar incentivo": recado da familia que o mascote le para o aluno. */
@Entity('incentivo')
export class Incentivo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'responsavel_id' })
  responsavelId!: number;

  @Column({ name: 'aluno_id' })
  alunoId!: number;

  /** Tarefa que motivou o incentivo; null = recado geral do dia. */
  @Column({ name: 'tarefa_id', type: 'int', unsigned: true, nullable: true })
  tarefaId!: number | null;

  @Column({ type: 'varchar', length: 300 })
  mensagem!: string;

  /** Ler em voz alta com a voz do mascote. */
  @Column({ type: 'tinyint', default: 1 })
  voz!: boolean;

  @Column({
    name: 'criado_em',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  criadoEm!: Date;

  @Column({ name: 'lido_em', type: 'datetime', nullable: true })
  lidoEm!: Date | null;
}
