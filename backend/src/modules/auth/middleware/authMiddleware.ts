import { Request, Response, NextFunction } from 'express';
import { verifyAccessTokenWithDenyList, TokenPayload } from '../services/jwtService';
import { AppError } from '../../../shared/errors/AppError';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('unauthorized', 401, 'Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = await verifyAccessTokenWithDenyList(token);
    req.user = payload;
    next();
  } catch {
    next(new AppError('unauthorized', 401, 'Invalid or expired token'));
  }
}
