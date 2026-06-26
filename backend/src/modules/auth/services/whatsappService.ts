import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function toE164(phoneNumber: string): string {
  // Accepts Egyptian 01... numbers or already-E.164 +20...
  const cleaned = phoneNumber.replace(/\s|-/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('0')) return `+20${cleaned.slice(1)}`;
  return `+20${cleaned}`;
}

export async function sendWhatsAppOtp(
  phoneNumber: string,
  otp: string
): Promise<WhatsAppSendResult> {
  const token = env.WHATSAPP_API_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = env.WHATSAPP_OTP_TEMPLATE_NAME;
  const language = env.WHATSAPP_OTP_LANGUAGE;

  if (!token || !phoneNumberId) {
    return { success: false, error: 'WhatsApp Cloud API credentials not configured' };
  }

  const to = toE164(phoneNumber);
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: otp }],
        },
      ],
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      logger.warn('WhatsApp OTP send failed', { phone: to, error: data });
      const errorMessage =
        data.error && typeof data.error === 'object' && 'message' in data.error
          ? String((data.error as { message: unknown }).message)
          : JSON.stringify(data);
      return {
        success: false,
        error: errorMessage,
      };
    }

    const messages = data.messages as Array<{ id: string }> | undefined;
    return {
      success: true,
      messageId: messages?.[0]?.id,
    };
  } catch (err) {
    logger.error('WhatsApp OTP request exception', { err, phone: to });
    return { success: false, error: (err as Error).message };
  }
}
