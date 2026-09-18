import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Responsavel } from './responsavel.entity';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { CreateResponsavelDto } from './dto/create-responsavel.dto';

@Injectable()
export class ResponsavelService {
  constructor(
    @InjectRepository(Responsavel)
    private readonly responsavelRepository: Repository<Responsavel>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cria usuario + responsavel na mesma transacao, igual ao professor:
   * se um falhar, nenhum dos dois e gravado.
   * escolaId do usuario fica null: responsavel nao pertence a uma escola,
   * o acesso dele vem dos vinculos em aluno_responsavel.
   */
  async create(data: CreateResponsavelDto) {
    return this.dataSource.transaction(async (manager) => {
      const usuarioRepo = manager.getRepository(Usuario);

      const jaExiste = await usuarioRepo.findOne({
        where: { email: data.email },
      });

      if (jaExiste) {
        throw new BadRequestException('Ja existe um usuario com este email');
      }

      const usuario = usuarioRepo.create({
        email: data.email,
        senha: await UsuarioService.hashSenha(data.senha),
        perfil: 'responsavel',
        escolaId: null,
      });

      const usuarioSalvo = await usuarioRepo.save(usuario);

      const responsavelRepo = manager.getRepository(Responsavel);

      const responsavel = responsavelRepo.create({
        nomeCompleto: data.nomeCompleto,
        telefone: data.telefone ?? null,
        usuarioId: usuarioSalvo.id,
      });

      const responsavelSalvo = await responsavelRepo.save(responsavel);

      return {
        data: {
          id: responsavelSalvo.id,
          nomeCompleto: responsavelSalvo.nomeCompleto,
          telefone: responsavelSalvo.telefone,
          email: usuarioSalvo.email,
        },
      };
    });
  }

  /**
   * Lista responsaveis vinculados a algum aluno da escola logada.
   * Precisa passar por aluno_responsavel + aluno porque `responsavel`
   * nao tem escola_id proprio.
   */
  async findAllByEscola(escolaId: number) {
    const resultado = await this.responsavelRepository
      .createQueryBuilder('responsavel')
      .innerJoin('responsavel.usuario', 'usuario')
      .innerJoin(
        'aluno_responsavel',
        'vinculo',
        'vinculo.responsavel_id = responsavel.id',
      )
      .innerJoin('aluno', 'aluno', 'aluno.id = vinculo.aluno_id')
      .where('aluno.escola_id = :escolaId', { escolaId })
      .select([
        'responsavel.id AS id',
        'responsavel.nomeCompleto AS nomeCompleto',
        'responsavel.telefone AS telefone',
        'usuario.email AS email',
      ])
      .distinct(true)
      .getRawMany();

    return { data: resultado };
  }
}
