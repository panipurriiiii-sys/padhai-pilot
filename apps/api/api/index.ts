import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { Express, Request, Response } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

let cachedServer: Express;

async function bootstrapServer(): Promise<Express> {
  if (!cachedServer) {
    const server = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.use(cookieParser());
    app.enableCors({
      origin: true,
      credentials: true,
    });
    app.setGlobalPrefix('api');
    await app.init();
    cachedServer = server;
  }
  return cachedServer;
}

export default async function handler(req: Request, res: Response) {
  const server = await bootstrapServer();
  return server(req, res);
}
