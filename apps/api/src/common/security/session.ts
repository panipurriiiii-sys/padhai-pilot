import jwt from 'jsonwebtoken';
import type { AuthenticatedUser } from '../types.js';
import { getJwtSecret, JWT_EXPIRES_IN } from './runtime.js';

/** Signs a session token. Same algorithm/expiry as AuthService (HS256, JWT_EXPIRES_IN). */
export function signSession(user: AuthenticatedUser): string {
  return jwt.sign(user, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}
