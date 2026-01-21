import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Seguridad: Encabezados HTTP (Helmet)
  app.use(helmet());

  // Validación global y transformación
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Serialización global (class-transformer)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // CORS restringido para producción
  const frontendUrl = configService.get<string>('FRONTEND_URL') || '*';
  app.enableCors({
    origin: frontendUrl === '*' ? '*' : frontendUrl.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Usar puerto configurado o 3001 para evitar conflictos con Next.js (3000)
  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on: http://127.0.0.1:${port}`);
}
bootstrap();
