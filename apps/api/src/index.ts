import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

let nestAppPromise: Promise<express.Express> | null = null;

async function bootstrap(): Promise<express.Express> {
  const expressInstance = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  
  app.use(helmet());
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  app.setGlobalPrefix('api');
  
  app.enableCors({ origin: true, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('WRC AI Sales Platform API')
    .setDescription('The API documentation for WRC')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return expressInstance;
}

export const api = onRequest({ region: 'asia-northeast1' }, async (req, res) => {
  if (!nestAppPromise) {
    nestAppPromise = bootstrap();
  }
  const app = await nestAppPromise;
  return app(req, res);
});
