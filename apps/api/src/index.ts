import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { AppModule } from './app.module';

let nestAppPromise: Promise<express.Express> | null = null;

async function bootstrap(): Promise<express.Express> {
  const expressInstance = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  app.enableCors({ origin: true, credentials: true });
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
