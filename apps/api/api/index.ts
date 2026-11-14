import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { Express, Request, Response } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { CORS_HEADERS, CORS_METHODS, corsOptions, getJwtSecret, isOriginAllowed } from '../src/common/security/runtime.js';

let cachedServerPromise: Promise<Express> | null = null;

async function bootstrapServer(): Promise<Express> {
  if (!cachedServerPromise) {
    cachedServerPromise = (async () => {
      getJwtSecret(); // refuse to boot in production without a strong JWT_SECRET
      const server = express();
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
      app.use(cookieParser());
      app.enableCors(corsOptions);
      app.useGlobalPipes(new ValidationPipe({ transform: true }));
      app.setGlobalPrefix('api');
      await app.init();
      return server;
    })().catch((err) => {
      // Clear promise so subsequent requests can retry rather than staying permanently rejected
      cachedServerPromise = null;
      throw err;
    });
  }
  return cachedServerPromise;
}

export default async function handler(req: Request, res: Response) {
  // Answer preflight early (before booting Nest) but only for allow-listed origins.
  const origin = req.headers.origin as string | undefined;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', CORS_METHODS.join(','));
    res.setHeader('Access-Control-Allow-Headers', CORS_HEADERS.join(','));
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    res.status(origin && !isOriginAllowed(origin) ? 403 : 204).end();
    return;
  }

  // Prepend /api if URL arrived without it (handles direct rewrites without /api)
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }

  const server = await bootstrapServer();
  return server(req, res);
}
