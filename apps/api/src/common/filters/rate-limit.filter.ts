import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { RateLimitExceededException } from '../../redis/redis.service.js';

@Catch(RateLimitExceededException)
export class RateLimitFilter implements ExceptionFilter {
  catch(exception: RateLimitExceededException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const result = exception.rateLimitResult;

    // Apply standard RFC rate limiting and Retry-After headers
    if (result && result.headers) {
      for (const [header, val] of Object.entries(result.headers)) {
        response.setHeader(header, val);
      }
    }

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: 'Too Many Requests',
      message: exception.message || `Rate limit exceeded. Please wait ${result?.resetInSeconds || 60} seconds before retrying.`,
      retryAfter: result?.resetInSeconds || 60,
      limit: result?.limit,
    });
  }
}

