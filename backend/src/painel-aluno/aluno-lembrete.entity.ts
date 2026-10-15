import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Lembretes que o proprio aluno cria na Agenda. */
@Entity('aluno_lembrete')
export class AlunoLembrete {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'aluno_id' })
  alunoId!: number;

  @Column({ type: 'varchar', length: 200 })
  texto!: string;

  @Column({ type: 'datetime' })
  quando!: Date;

  @Column({
    name: 'criado_em',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  criadoEm!: Date;
}
