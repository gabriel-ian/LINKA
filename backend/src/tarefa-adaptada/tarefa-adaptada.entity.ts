import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tarefa } from '../tarefa/tarefa.entity';
import { Aluno } from '../aluno/aluno.entity';

/** Tabela `tarefa_adaptada`. Versao adaptada do enunciado de uma tarefa
 * para um aluno especifico (tipicamente neurodivergente). */
@Entity('tarefa_adaptada')
export class TarefaAdaptada {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tarefa_id', nullable: true })
  tarefaId!: number | null;

  @Column({ name: 'aluno_id', nullable: true })
  alunoId!: number | null;

  @Column({ type: 'text', nullable: true })
  descricao_adaptada!: string | null;

  /** Passos curtos da versao adaptada, em ordem. */
  @Column({ type: 'json', nullable: true })
  passos!: string[] | null;

  /** Recursos usados na adaptacao, exibidos como etiquetas ("5 passos curtos"...). */
  @Column({ type: 'json', nullable: true })
  recursos!: string[] | null;

  @Column({ type: 'tinyint', default: 1 })
  gerado_por_ia!: boolean;

  @ManyToOne(() => Tarefa, { nullable: true })
  @JoinColumn({ name: 'tarefa_id' })
  tarefa!: Tarefa | null;

  @ManyToOne(() => Aluno, { nullable: true })
  @JoinColumn({ name: 'aluno_id' })
  aluno!: Aluno | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  criado_em!: Date;

  @Column({ name: 'atualizado_em', type: 'datetime', nullable: true })
  atualizadoEm!: Date | null;
}
