import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Aluno } from '../aluno/aluno.entity';
import { Responsavel } from '../responsavel/responsavel.entity';

/**
 * Tabela `aluno_responsavel` — chave primaria composta
 * (aluno_id, responsavel_id), mesmo padrao de `matricula`. Define quais
 * alunos um responsavel pode acompanhar.
 */
@Entity('aluno_responsavel')
export class AlunoResponsavel {
  @PrimaryColumn({ name: 'aluno_id' })
  alunoId!: number;

  @PrimaryColumn({ name: 'responsavel_id' })
  responsavelId!: number;

  @ManyToOne(() => Aluno)
  @JoinColumn({ name: 'aluno_id' })
  aluno!: Aluno;

  @ManyToOne(() => Responsavel)
  @JoinColumn({ name: 'responsavel_id' })
  responsavel!: Responsavel;
}
