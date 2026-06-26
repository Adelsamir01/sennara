import crypto from 'crypto';
import { Request, Response } from 'express';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

function getRawBody(req: Request): Buffer | undefined {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  return undefined;
}

function verifySignature(req: Request, body: Buffer): boolean {
  const appSecret = env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // Signature verification disabled when no app secret is configured
    return true;
  }

  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature?.startsWith('sha256=')) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature.slice(7), 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

export function verifyWebhook(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && typeof challenge === 'string') {
    logger.info('WhatsApp webhook subscription verified');
    res.status(200).send(challenge);
    return;
  }

  logger.warn('WhatsApp webhook verification failed', { mode, token });
  res.sendStatus(403);
}

export function receiveWebhook(req: Request, res: Response): void {
  // Acknowledge immediately so Meta does not retry
  res.sendStatus(200);

  const rawBody = getRawBody(req);
  if (!rawBody) {
    logger.warn('WhatsApp webhook received without raw body');
    return;
  }

  if (!verifySignature(req, rawBody)) {
    logger.warn('WhatsApp webhook signature mismatch');
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    logger.warn('WhatsApp webhook received invalid JSON');
    return;
  }

  if (!payload || typeof payload !== 'object' || (payload as Record<string, unknown>).object !== 'whatsapp_business_account') {
    return;
  }

  const entries = ((payload as Record<string, unknown>).entry as Array<Record<string, unknown>>) || [];
  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) || [];
    for (const change of changes) {
      const value = (change.value as Record<string, unknown>) || {};

      const statuses = (value.statuses as Array<Record<string, unknown>>) || [];
      for (const status of statuses) {
        logger.info('WhatsApp message status update', {
          messageId: status.id,
          status: status.status,
          recipient: status.recipient_id,
        });
      }

      const messages = (value.messages as Array<Record<string, unknown>>) || [];
      for (const message of messages) {
        const from = message.from as string;
        const type = message.type as string;
        const text = ((message.text as Record<string, unknown>)?.body as string) || '';
        logger.info('WhatsApp inbound message', { from, type, text });

        // Future: handle opt-in / opt-out / help commands here
      }
    }
  }
}
