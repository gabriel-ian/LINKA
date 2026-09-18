import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Autenticar usuario',
    description:
      'Valida email e senha contra a tabela usuario e devolve o token JWT ' +
      'junto com o perfil resolvido pelo servidor.',
  })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.senha);
  }
}
