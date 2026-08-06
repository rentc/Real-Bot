import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS for admin web app
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.API_PORT || 3000;
  const host = process.env.API_HOST || '0.0.0.0';

  await app.listen(port, host);
  logger.log(`🚀 WRC API server running on http://${host}:${port}`);
  logger.log(`📋 Health check: http://${host}:${port}/api/health`);
}

bootstrap();
