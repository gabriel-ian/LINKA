import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Atras de um proxy (nginx no Docker), o IP real vem no X-Forwarded-For;
  // o limite de tentativas do login depende dele.
  if (config.get<string>('TRUST_PROXY') === 'true') app.set('trust proxy', 1);

  // Cabecalhos de seguranca. A API so devolve JSON e arquivos, entao o CSP
  // fica desligado (ele quebraria a pagina do Swagger em /api).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // No Render o endereco do site pode chegar sem https:// e ate sem o
  // dominio (ex.: linka-agfi): completa para https://linka-agfi.onrender.com.
  const bruto = config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
  const host =
    bruto.includes('.') || bruto.includes('localhost')
      ? bruto
      : `${bruto}.onrender.com`;
  app.enableCors({
    origin: /^https?:\/\//.test(host) ? host : `https://${host}`,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Linka')
    .setDescription(
      'API da plataforma educacional para apoio a alunos com neurodivergencia',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(Number(config.get<string>('PORT') ?? 3000));
}

void bootstrap();
