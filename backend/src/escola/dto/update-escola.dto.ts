import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEscolaDto } from './create-escola.dto';

/** A senha nao e trocada por aqui; o e-mail atualiza o login da escola. */
export class UpdateEscolaDto extends PartialType(
  OmitType(CreateEscolaDto, ['senha'] as const),
) {}
