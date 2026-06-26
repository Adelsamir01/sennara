import { Request, Response, NextFunction } from 'express';
import { initiatePaymentSchema } from '../dto/paymentSchemas';
import * as paymentService from '../services/paymentService';

export async function getPricing(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pricing = paymentService.getPricing();
    res.status(200).json({ pricing });
  } catch (err) {
    next(err);
  }
}

export async function initiate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = initiatePaymentSchema.parse(req.body);
    const result = await paymentService.initiatePayment(req.user!.userId, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function webhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const provider = req.params.provider;
    const verification = await paymentService.handleWebhook(provider, req.body);
    res.status(200).json(verification);
  } catch (err) {
    next(err);
  }
}
