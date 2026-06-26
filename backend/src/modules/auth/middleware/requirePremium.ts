import { Request, Response, NextFunction } from 'express';

export function requirePremium(_req: Request, _res: Response, next: NextFunction): void {
  // All features are currently free for every user.
  next();
}
