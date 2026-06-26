import { PoolClient } from 'pg';
import { query } from '../../../config/database';

export interface CreateUserInput {
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  authProvider: 'phone_otp' | 'google' | 'apple';
  authProviderId?: string;
  locale?: string;
}

export interface UserRow {
  id: string;
  phone_number: string | null;
  email: string | null;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  locale: string;
  auth_provider: string;
  subscription_tier: string;
  subscription_expires_at: Date | null;
  default_privacy: string;
  is_active: boolean;
  last_seen_at: Date | null;
  created_at: Date;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE id = $1 AND is_active = TRUE LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
}

export async function findUserByPhone(phoneNumber: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE phone_number = $1 AND is_active = TRUE LIMIT 1',
    [phoneNumber]
  );
  return result.rows[0] || null;
}

export async function findUserByProvider(
  provider: string,
  providerId: string
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE auth_provider = $1 AND auth_provider_id = $2 AND is_active = TRUE LIMIT 1',
    [provider, providerId]
  );
  return result.rows[0] || null;
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const handle = input.displayName
    ? `${input.displayName.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 10000)}`
    : `angler_${Math.floor(Math.random() * 100000)}`;

  const result = await query<UserRow>(
    `INSERT INTO users (
      phone_number, email, display_name, handle, avatar_url,
      auth_provider, auth_provider_id, locale
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      input.phoneNumber || null,
      input.email || null,
      input.displayName || null,
      handle,
      input.avatarUrl || null,
      input.authProvider,
      input.authProviderId || null,
      input.locale || 'ar',
    ]
  );
  return result.rows[0];
}

export async function updateUser(
  userId: string,
  updates: Partial<Pick<UserRow, 'display_name' | 'avatar_url' | 'locale' | 'default_privacy' | 'subscription_tier' | 'subscription_expires_at'>>
): Promise<UserRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) return findUserById(userId);

  values.push(userId);
  const result = await query<UserRow>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function upsertSocialUser(
  input: CreateUserInput,
  client?: PoolClient
): Promise<UserRow> {
  if (!input.authProviderId) throw new Error('Provider ID required');

  const existing = await findUserByProvider(input.authProvider, input.authProviderId);
  if (existing) return existing;

  if (client) {
    const result = await client.query<UserRow>(
      `INSERT INTO users (
        phone_number, email, display_name, handle, avatar_url,
        auth_provider, auth_provider_id, locale
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        input.phoneNumber || null,
        input.email || null,
        input.displayName || null,
        `angler_${Math.floor(Math.random() * 100000)}`,
        input.avatarUrl || null,
        input.authProvider,
        input.authProviderId,
        input.locale || 'ar',
      ]
    );
    return result.rows[0];
  }

  return createUser(input);
}
