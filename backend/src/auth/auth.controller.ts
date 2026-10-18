import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuarioId } from './usuario-id.decorator';
import { AlterarSenhaDto, CriarSenhaDto } from './dto/alterar-senha.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

/** 10 tentativas por minuto: no login conta por IP + e-mail, na senha por usuario. */
const LIMITE_SENHA = { geral: { limit: 10, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle(LIMITE_SENHA)
  @ApiTooManyRequestsResponse({ description: 'Muitas tentativas seguidas' })
  @ApiOperation({
    summary: 'Autenticar usuario',
    description:
      'Valida email e senha contra a tabela usuario e devolve o token JWT ' +
      'junto com o perfil resolvido pelo servidor.',
  })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.senha);
  }

  @Post('senha')
  @Throttle(LIMITE_SENHA)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trocar a propria senha (qualquer perfil logado)' })
  alterarSenha(@UsuarioId() usuarioId: number, @Body() dto: AlterarSenhaDto) {
    return this.authService.alterarSenha(
      usuarioId,
      dto.senhaAtual,
      dto.novaSenha,
    );
  }

  @Post('senha/primeiro-acesso')
  @Throttle(LIMITE_SENHA)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar a propria senha no lugar da provisoria',
    description: 'So funciona enquanto a senha atual for provisoria.',
  })
  criarSenha(@UsuarioId() usuarioId: number, @Body() dto: CriarSenhaDto) {
    return this.authService.criarSenha(usuarioId, dto.novaSenha);
  }

  @Post('senha/manter')
  @Throttle(LIMITE_SENHA)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Continuar com a senha provisoria recebida' })
  manterSenha(@UsuarioId() usuarioId: number) {
    return this.authService.manterSenha(usuarioId);
  }
}
