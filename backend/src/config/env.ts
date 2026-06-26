import 'dotenv/config';

function requireRaw(key: string, prodOnly = false): string {
  const value = process.env[key];
  if (!value) {
    // Tests run before setup files can set everything, so provide safe fallbacks.
    if (process.env.NODE_ENV === 'test') {
      return `test-${key.toLowerCase()}`;
    }
    if (process.env.NODE_ENV === 'production' || !prodOnly) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  return value ?? '';
}

function getDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getBool(key: string, defaultValue = false): boolean {
  return (process.env[key] ?? String(defaultValue)) === 'true';
}

function parseDurationSeconds(dur: string): number {
  const match = dur.match(/^(\d+)([smhd])$/i);
  if (!match) return 3600;
  const n = parseInt(match[1], 10);
  switch (match[2].toLowerCase()) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 3600;
    case 'd':
      return n * 86400;
    default:
      return n;
  }
}

export const env = {
  get NODE_ENV() {
    return getDefault('NODE_ENV', 'development');
  },
  get PORT() {
    return parseInt(getDefault('PORT', '4000'), 10);
  },
  get API_PREFIX() {
    return getDefault('API_PREFIX', '/api/v1');
  },

  get JWT_ACCESS_SECRET() {
    return requireRaw('JWT_ACCESS_SECRET');
  },
  get JWT_REFRESH_SECRET() {
    return requireRaw('JWT_REFRESH_SECRET');
  },
  get JWT_ACCESS_TTL() {
    return getDefault('JWT_ACCESS_TTL', '15m');
  },
  get JWT_REFRESH_TTL() {
    return getDefault('JWT_REFRESH_TTL', '7d');
  },
  get OTP_SECRET() {
    return requireRaw('OTP_SECRET');
  },
  get OTP_TEST_MODE() {
    return getBool('OTP_TEST_MODE', false);
  },

  get DATABASE_URL() {
    return requireRaw('DATABASE_URL', true) || 'postgresql://postgres:postgres@localhost:5432/sennara_dev';
  },
  get DB_POOL_MAX() {
    return parseInt(getDefault('DB_POOL_MAX', '20'), 10);
  },
  get DB_IDLE_TIMEOUT_MS() {
    return parseInt(getDefault('DB_IDLE_TIMEOUT_MS', '30000'), 10);
  },
  get DB_CONNECTION_TIMEOUT_MS() {
    return parseInt(getDefault('DB_CONNECTION_TIMEOUT_MS', '5000'), 10);
  },
  get DATABASE_SSL() {
    return getBool('DATABASE_SSL', false);
  },

  get REDIS_URL() {
    return requireRaw('REDIS_URL', true) || 'redis://localhost:6379/0';
  },

  get S3_ENDPOINT() {
    return getDefault('S3_ENDPOINT', 'http://localhost:9000');
  },
  get S3_PUBLIC_ENDPOINT() {
    return process.env.S3_PUBLIC_ENDPOINT;
  },
  get S3_REGION() {
    return getDefault('S3_REGION', 'us-east-1');
  },
  get S3_BUCKET() {
    return getDefault('S3_BUCKET', 'sennara-uploads');
  },
  get S3_ACCESS_KEY_ID() {
    return getDefault('S3_ACCESS_KEY_ID', 'minioadmin');
  },
  get S3_SECRET_ACCESS_KEY() {
    return getDefault('S3_SECRET_ACCESS_KEY', 'minioadmin');
  },

  get WHATSAPP_API_TOKEN() {
    return process.env.WHATSAPP_API_TOKEN;
  },
  get WHATSAPP_PHONE_NUMBER_ID() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID;
  },
  get WHATSAPP_OTP_TEMPLATE_NAME() {
    return getDefault('WHATSAPP_OTP_TEMPLATE_NAME', 'sennara_otp');
  },
  get WHATSAPP_OTP_LANGUAGE() {
    return getDefault('WHATSAPP_OTP_LANGUAGE', 'ar');
  },
  get WHATSAPP_WEBHOOK_VERIFY_TOKEN() {
    return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  },
  get WHATSAPP_APP_SECRET() {
    return process.env.WHATSAPP_APP_SECRET;
  },

  get TWILIO_ACCOUNT_SID() {
    return process.env.TWILIO_ACCOUNT_SID;
  },
  get TWILIO_AUTH_TOKEN() {
    return process.env.TWILIO_AUTH_TOKEN;
  },
  get TWILIO_PHONE_NUMBER() {
    return process.env.TWILIO_PHONE_NUMBER;
  },

  get LOG_LEVEL() {
    return getDefault('LOG_LEVEL', 'info');
  },
  get METRICS_BASIC_AUTH_PASSWORD() {
    return process.env.METRICS_BASIC_AUTH_PASSWORD;
  },

  parseDurationSeconds,
};

/**
 * Explicitly validates required production secrets. Call this once at startup.
 */
export function validateEnv(): void {
  env.JWT_ACCESS_SECRET;
  env.JWT_REFRESH_SECRET;
  env.OTP_SECRET;
}
