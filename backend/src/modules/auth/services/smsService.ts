import { logger } from '../../../config/logger';

export type SmsGateway = 'twilio';

interface SmsSendResult {
  success: boolean;
  gateway: SmsGateway;
  messageId?: string;
  error?: string;
}

export async function sendOtpSms(phoneNumber: string, otp: string): Promise<SmsSendResult> {
  const message = `رمز التحقق الخاص بك في الصياد هو: ${otp}\nYour Sennara verification code is: ${otp}`;
  return sendViaTwilio(phoneNumber, message);
}

async function sendViaTwilio(phoneNumber: string, message: string): Promise<SmsSendResult> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      return { success: false, gateway: 'twilio', error: 'Missing Twilio credentials' };
    }

    const to = phoneNumber.startsWith('+') ? phoneNumber : `+2${phoneNumber.replace(/^0/, '')}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: from, To: to, Body: message }),
      }
    );

    const data = (await response.json()) as Record<string, unknown>;

    if (response.ok && data.sid) {
      return { success: true, gateway: 'twilio', messageId: String(data.sid) };
    }
    logger.warn('Twilio SMS send failed', { phone: to, error: data });
    return { success: false, gateway: 'twilio', error: JSON.stringify(data) };
  } catch (err) {
    logger.error('Twilio SMS request exception', { err, phone: phoneNumber });
    return { success: false, gateway: 'twilio', error: (err as Error).message };
  }
}
