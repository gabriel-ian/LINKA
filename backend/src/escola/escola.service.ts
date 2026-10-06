import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { Escola } from './escola.entity';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { Aluno } from '../aluno/aluno.entity';
import { Professor } from '../professor/professor.entity';
import { Turma } from '../turma/turma.entity';
import { CreateEscolaDto } from './dto/create-escola.dto';
import { UpdateEscolaDto } from './dto/update-escola.dto';
import { DesativarEscolaDto } from './dto/desativar-escola.dto';

/** Escola como o painel ADM ve: dados + login + contagens. Nunca leva senha. */
export type EscolaDetalhe = Escola & {
  email: string | null;
  /** Ativa, mas a coordenacao ainda nao fez o primeiro login. */
  pendente: boolean;
  totalAlunosNee: number;
  totalProfessores: number;
  totalTurmas: number;
};

@Injectable()
export class EscolaService {
  constructor(
    @InjectRepository(Escola)
    private readonly escolaRepository: Repository<Escola>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    const escolas = await this.escolaRepository.find({
      order: { nome: 'ASC' },
    });

    return { data: await this.detalhar(escolas) };
  }

  async findOne(id: number) {
    const escola = await this.buscarOuFalhar(id);
    const [detalhe] = await this.detalhar([escola]);

    return { data: detalhe };
  }

  /**
   * Cria escola + usuario (perfil escola) na mesma transacao:
   * se um falhar, nenhum dos dois e gravado.
   */
  async create(data: CreateEscolaDto) {
    const id = await this.dataSource.transaction(async (manager) => {
      const usuarioRepo = manager.getRepository(Usuario);

      if (await usuarioRepo.findOne({ where: { email: data.email } })) {
        throw new BadRequestException('Ja existe um usuario com este email');
      }

      const { email, senha, ...dadosEscola } = data;
      const escolaRepo = manager.getRepository(Escola);
      const escola = await escolaRepo.save(
        escolaRepo.create({ ...dadosEscola, cnpj: data.cnpj ?? null }),
      );

      await usuarioRepo.save(
        usuarioRepo.create({
          email,
          senha: await UsuarioService.hashSenha(senha),
          perfil: 'escola',
          escolaId: escola.id,
        }),
      );

      return escola.id;
    });

    return this.findOne(id);
  }

  async update(id: number, data: UpdateEscolaDto, adminEmail: string | null = null) {
    await this.buscarOuFalhar(id);
    const { email, ...dadosEscola } = data;

    await this.dataSource.transaction(async (manager) => {
      if (email !== undefined) {
        const usuarioRepo = manager.getRepository(Usuario);
        const login = await usuarioRepo.findOne({
          where: { escolaId: id, perfil: 'escola' },
          order: { id: 'ASC' },
        });

        if (!login) {
          throw new BadRequestException(
            'Esta escola nao tem login de acesso cadastrado',
          );
        }

        const emUso = await usuarioRepo.findOne({
          where: { email, id: Not(login.id) },
        });

        if (emUso) {
          throw new BadRequestException('Ja existe um usuario com este email');
        }

        await usuarioRepo.update(login.id, { email });
      }

      await manager.getRepository(Escola).update(id, {
        ...dadosEscola,
        atualizadoEm: new Date(),
        atualizadoPor: adminEmail,
      });
    });

    return this.findOne(id);
  }

  /** Desativacao simples (DELETE), sem motivo. */
  async remove(id: number) {
    await this.buscarOuFalhar(id);
    await this.escolaRepository.update(id, {
      ativo: false,
      desativadaEm: hoje(),
    });

    return { data: true };
  }

  async desativar(id: number, data: DesativarEscolaDto, adminEmail: string | null = null) {
    const escola = await this.buscarOuFalhar(id);

    if (!escola.ativo) {
      throw new BadRequestException('A escola ja esta desativada');
    }

    await this.escolaRepository.update(id, {
      ativo: false,
      desativadaEm: data.data.slice(0, 10),
      motivoDesativacao: data.motivo,
      observacaoDesativacao: data.observacao?.trim() || null,
      atualizadoEm: new Date(),
      atualizadoPor: adminEmail,
    });

    return this.findOne(id);
  }

  async activate(id: number, adminEmail: string | null = null) {
    await this.buscarOuFalhar(id);
    await this.escolaRepository.update(id, {
      ativo: true,
      desativadaEm: null,
      motivoDesativacao: null,
      observacaoDesativacao: null,
      atualizadoEm: new Date(),
      atualizadoPor: adminEmail,
    });

    return { data: true };
  }

  private async buscarOuFalhar(id: number): Promise<Escola> {
    const escola = await this.escolaRepository.findOne({ where: { id } });

    if (!escola) {
      throw new NotFoundException('Escola nao encontrada');
    }

    return escola;
  }

  /** Junta login da escola e contagens, com uma consulta por tabela. */
  private async detalhar(escolas: Escola[]): Promise<EscolaDetalhe[]> {
    if (escolas.length === 0) return [];

    const ids = escolas.map((e) => e.id);

    const logins = await this.dataSource.getRepository(Usuario).find({
      where: { perfil: 'escola', escolaId: In(ids) },
      order: { id: 'ASC' },
    });

    const [alunos, professores, turmas] = await Promise.all([
      this.contarPorEscola(Aluno, ids, 't.ativo = 1 AND t.neurodivergente = 1'),
      this.contarPorEscola(Professor, ids),
      this.contarPorEscola(Turma, ids),
    ]);

    return escolas.map((escola) => {
      // A primeira conta da escola e a da coordenacao.
      const login = logins.find((u) => u.escolaId === escola.id);

      return {
        ...escola,
        email: login?.email ?? null,
        pendente: escola.ativo && !!login && !login.ultimoLogin,
        totalAlunosNee: alunos.get(escola.id) ?? 0,
        totalProfessores: professores.get(escola.id) ?? 0,
        totalTurmas: turmas.get(escola.id) ?? 0,
      };
    });
  }

  private async contarPorEscola(
    entidade: typeof Aluno | typeof Professor | typeof Turma,
    ids: number[],
    filtro?: string,
  ): Promise<Map<number, number>> {
    const consulta = this.dataSource
      .getRepository(entidade)
      .createQueryBuilder('t')
      .select('t.escola_id', 'escolaId')
      .addSelect('COUNT(*)', 'total')
      .where('t.escola_id IN (:...ids)', { ids })
      .groupBy('t.escola_id');

    if (filtro) consulta.andWhere(filtro);

    const linhas: { escolaId: number; total: string }[] = await consulta.getRawMany();

    return new Map(linhas.map((l) => [Number(l.escolaId), Number(l.total)]));
  }
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
