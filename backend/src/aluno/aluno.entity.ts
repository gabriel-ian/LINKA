import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Escola } from '../escola/escola.entity';
import { Usuario } from '../usuario/usuario.entity';

/**
 * Tabela `aluno`.
 * O login do aluno e opcional (usuario perfil 'aluno', via usuario_id);
 * a familia acompanha pelo responsavel (aluno_responsavel).
 */
export interface PreferenciasAluno {
  ouvirVoz: boolean;
  passosCurtos: boolean;
  letrasMaiores: boolean;
  /** 0 normal, 1 grande, 2 maior, 3 enorme (letrasMaiores = tamanho > 0). */
  tamanhoLetra: 0 | 1 | 2 | 3;
  modoCalmo: boolean;
  /** Fonte Lexend, com mais espaco entre letras e linhas. */
  fonteDislexia: boolean;
  /** Texto preto, bordas fortes e cores mais escuras. */
  altoContraste: boolean;
  /** Regua de leitura: faixa que acompanha o mouse/dedo e destaca a linha. */
  reguaLeitura: boolean;
  /** Relogio de cada passo, com pausa sugerida (ajuda no foco). */
  tempoPasso: boolean;
  mascote: 'dino' | 'coruja' | 'robo';
  /** Nome da voz do navegador escolhida (null = a primeira em portugues). */
  voz: string | null;
  velocidadeVoz: 'devagar' | 'normal' | 'rapida';
  /** Quando o aluno salvou o desenho do Inicio (null = mostra o mascote). */
  desenhoEm: string | null;
}

export const PREFERENCIAS_PADRAO: PreferenciasAluno = {
  ouvirVoz: true,
  passosCurtos: true,
  letrasMaiores: false,
  tamanhoLetra: 0,
  modoCalmo: false,
  fonteDislexia: false,
  altoContraste: false,
  reguaLeitura: false,
  tempoPasso: false,
  mascote: 'dino',
  voz: null,
  velocidadeVoz: 'normal',
  desenhoEm: null,
};

@Entity('aluno')
export class Aluno {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nome_completo' })
  nomeCompleto!: string;

  /**
   * String 'YYYY-MM-DD', nao Date: converter para Date faz a data
   * andar um dia por causa do fuso (UTC vs America/Sao_Paulo).
   */
  @Column({ type: 'date', nullable: true })
  data_nascimento!: string | null;

  /** Codigo Geral de Matricula da rede de ensino. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  cgm!: string | null;

  @Column({ name: 'escola_id' })
  escolaId!: number;

  @ManyToOne(() => Escola)
  @JoinColumn({ name: 'escola_id' })
  escola!: Escola;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId!: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario | null;

  @Column({ default: false })
  neurodivergente!: boolean;

  /** Nome do arquivo do laudo em uploads/laudos (nunca exposto direto). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  laudo!: string | null;

  @Column({ name: 'laudo_enviado_em', type: 'datetime', nullable: true })
  laudoEnviadoEm!: Date | null;

  /** Perfil de aprendizagem, preenchido pela escola/professor. */
  @Column({ type: 'text', nullable: true })
  dificuldades!: string | null;

  @Column({ name: 'pontos_fortes', type: 'text', nullable: true })
  pontosFortes!: string | null;

  /** Separados por virgula: "Dinossauros, Futebol". */
  @Column({ type: 'varchar', length: 255, nullable: true })
  interesses!: string | null;

  /** Como o aluno gosta de aprender (tela "Meu perfil"). */
  @Column({ type: 'json', nullable: true })
  preferencias!: PreferenciasAluno | null;

  @Column({ default: true })
  ativo!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  criado_em!: Date;
}
