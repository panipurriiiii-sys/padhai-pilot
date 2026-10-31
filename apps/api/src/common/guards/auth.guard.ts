import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../types.js';
import { getJwtSecret } from '../security/runtime.js';
import { AccessService } from '../access/access.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AccessService) private readonly access: AccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const cookieToken = request.cookies?.token;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      throw new UnauthorizedException('Authentication required. No session or bearer token provided.');
    }

    let decoded: AuthenticatedUser;
    try {
      decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthenticatedUser;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }

    // Server-side check that the membership / user / tenant behind the token are still valid.
    await this.access.verifySession(decoded);
    request.user = decoded;
    return true;
  }
}
