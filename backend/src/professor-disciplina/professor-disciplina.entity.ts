import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Professor } from '../professor/professor.entity';
import { Disciplina } from '../disciplina/disciplina.entity';

/**
 * Tabela `professor_disciplina` — chave primaria composta
 * (professor_id, disciplina_id). Quais disciplinas um professor esta
 * habilitado a dar. A PK composta ja impede vinculo duplicado no banco.
 */
@Entity('professor_disciplina')
export class ProfessorDisciplina {
  @PrimaryColumn({ name: 'professor_id' })
  professorId!: number;

  @PrimaryColumn({ name: 'disciplina_id' })
  disciplinaId!: number;

  @ManyToOne(() => Professor)
  @JoinColumn({ name: 'professor_id' })
  professor!: Professor;

  @ManyToOne(() => Disciplina)
  @JoinColumn({ name: 'disciplina_id' })
  disciplina!: Disciplina;
}
