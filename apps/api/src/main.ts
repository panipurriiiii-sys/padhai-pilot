import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import express from 'express';
import { corsOptions, getJwtSecret } from './common/security/runtime.js';

async function bootstrap() {
  getJwtSecret(); // fail fast when production is missing a strong JWT_SECRET
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ limit: '35mb', extended: true }));
  app.use(cookieParser());
  app.enableCors(corsOptions);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('api');
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`PadhaiPilot API running on http://localhost:${port}`);
}
bootstrap();
