import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from './jwt';

export interface AuthRequest extends Request {
  user?: JWTPayload;
  userId?: number;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  (req as any).userId = payload.user_id;
  next();
}
