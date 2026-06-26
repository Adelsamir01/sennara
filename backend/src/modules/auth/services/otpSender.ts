import { env } from '../../../config/env';
import { sendWhatsAppOtp } from './whatsappService';
import { sendOtpSms } from './smsService';

export interface OtpSendResult {
  success: boolean;
  gateway: 'whatsapp' | 'twilio' | 'none';
  messageId?: string;
  error?: string;
}

export async function sendOtp(phoneNumber: string, otp: string): Promise<OtpSendResult> {
  // Primary: WhatsApp Cloud API
  if (env.WHATSAPP_API_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
    const result = await sendWhatsAppOtp(phoneNumber, otp);
    if (result.success) {
      return { success: true, gateway: 'whatsapp', messageId: result.messageId };
    }
    // Fall back to SMS if configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const sms = await sendOtpSms(phoneNumber, otp);
      return {
        success: sms.success,
        gateway: 'twilio',
        messageId: sms.messageId,
        error: sms.error,
      };
    }
    return { success: false, gateway: 'whatsapp', error: result.error };
  }

  // Fallback: Twilio SMS
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    const sms = await sendOtpSms(phoneNumber, otp);
    return {
      success: sms.success,
      gateway: 'twilio',
      messageId: sms.messageId,
      error: sms.error,
    };
  }

  return {
    success: false,
    gateway: 'none',
    error: 'No OTP gateway configured. Set WhatsApp Cloud API or Twilio credentials.',
  };
}
