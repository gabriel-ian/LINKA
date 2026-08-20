import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('escola')
export class Escola {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  senha!: string;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  criado_em!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  atualizado_em!: Date;

  @Column()
  ativo!: boolean;
}