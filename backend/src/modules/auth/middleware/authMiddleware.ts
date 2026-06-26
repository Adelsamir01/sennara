import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/jwtService';
import { AppError } from '../../../shared/errors/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('unauthorized', 401, 'Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new AppError('unauthorized', 401, 'Invalid or expired token'));
  }
}

export function requirePremium(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.tier !== 'premium') {
    next(new AppError('forbidden', 403, 'Premium subscription required'));
    return;
  }
  next();
}
