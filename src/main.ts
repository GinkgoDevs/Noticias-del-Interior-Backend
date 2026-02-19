import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpAdapterHost } from '@nestjs/core';
import { json, urlencoded } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Seguridad: Encabezados HTTP (Helmet)
  app.use(helmet());

  // Performance: Compresión de respuestas
  app.use(compression());

  // Robustez: Cierre limpio del servidor (Graceful Shutdown)
  app.enableShutdownHooks();

  // Límites de tamaño para prevenir ataques DoS
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Versionado de API (v1, v2, etc)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validación global y transformación
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  // Interceptores globales
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Noticias Del Interior API')
    .setDescription('API para la gestión de noticias y juegos del interior')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

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
  console.log(`Swagger documentation available on: http://127.0.0.1:${port}/docs`);
}
bootstrap();
