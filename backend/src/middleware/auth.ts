import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'autoreach_jwt_production_secret_key_2026_secure';

export interface TokenPayload {
  userId: string;
  id: string;
  email: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: TokenPayload;
    }
  }
}

export function generateToken(payload: { userId: string; email: string; name: string; role: string; id?: string }): string {
  const tokenData: TokenPayload = {
    userId: payload.userId,
    id: payload.id || payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
  return jwt.sign(tokenData, JWT_SECRET, { expiresIn: '14d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please sign in again.' });
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      req.userId = decoded.userId;
      req.user = decoded;
    } catch (_) {}
  }
  next();
}
