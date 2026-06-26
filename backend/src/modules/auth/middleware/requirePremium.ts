import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/AppError';

export function requirePremium(req: Request, _res: Response, next: NextFunction): void {
  const user = req.user;
  if (user?.tier !== 'premium') {
    next(new AppError('forbidden', 403, 'Premium subscription required'));
    return;
  }

  const expiresAt = user.subscriptionExpiresAt;
  if (!expiresAt || new Date(expiresAt) <= new Date()) {
    next(new AppError('forbidden', 403, 'Premium subscription expired'));
    return;
  }

  next();
}
