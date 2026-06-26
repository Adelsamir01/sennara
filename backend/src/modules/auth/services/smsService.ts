export type SmsGateway = 'smsmisr' | 'twilio';

interface SmsSendResult {
  success: boolean;
  gateway: SmsGateway;
  messageId?: string;
  error?: string;
}

export async function sendOtpSms(
  phoneNumber: string,
  otp: string,
  preferredGateway: SmsGateway = 'smsmisr'
): Promise<SmsSendResult> {
  const message = `رمز التحقق الخاص بك في الصياد هو: ${otp}\nYour Sennara verification code is: ${otp}`;

  if (preferredGateway === 'smsmisr') {
    const result = await sendViaSmsmisr(phoneNumber, message);
    if (result.success) return result;
    return sendViaTwilio(phoneNumber, message);
  }

  const result = await sendViaTwilio(phoneNumber, message);
  if (result.success) return result;
  return sendViaSmsmisr(phoneNumber, message);
}

async function sendViaSmsmisr(phoneNumber: string, message: string): Promise<SmsSendResult> {
  try {
    const username = process.env.SMSMISR_USERNAME;
    const password = process.env.SMSMISR_PASSWORD;
    const sender = process.env.SMSMISR_SENDER;

    if (!username || !password || !sender) {
      return { success: false, gateway: 'smsmisr', error: 'Missing SMSMISR credentials' };
    }

    // SMSMISR HTTP GET API shape (verify with current provider docs)
    const url = new URL('https://smsmisr.com/api/webapi/');
    url.searchParams.set('username', username);
    url.searchParams.set('password', password);
    url.searchParams.set('language', '2'); // 2 = Unicode Arabic/English
    url.searchParams.set('sender', sender);
    url.searchParams.set('mobile', phoneNumber.replace(/^0/, '2'));
    url.searchParams.set('message', message);

    const response = await fetch(url.toString());
    const data = (await response.json()) as Record<string, unknown>;

    if (data?.code === '1901' || data?.code === '1903') {
      return { success: true, gateway: 'smsmisr', messageId: String(data.ID || '') };
    }
    return { success: false, gateway: 'smsmisr', error: JSON.stringify(data) };
  } catch (err) {
    return { success: false, gateway: 'smsmisr', error: (err as Error).message };
  }
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
    return { success: false, gateway: 'twilio', error: JSON.stringify(data) };
  } catch (err) {
    return { success: false, gateway: 'twilio', error: (err as Error).message };
  }
}
