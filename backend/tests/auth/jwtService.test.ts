import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/modules/auth/services/jwtService';

describe('JWT Service', () => {
  const user = {
    id: 'user-123',
    phone_number: '01012345678',
    subscription_tier: 'free',
    subscription_expires_at: null,
  };

  it('generates and verifies access tokens', () => {
    const tokens = generateTokens(user);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const payload = verifyAccessToken(tokens.accessToken);
    expect(payload.userId).toBe('user-123');
    expect(payload.tier).toBe('free');
  });

  it('generates and verifies refresh tokens', () => {
    const tokens = generateTokens(user);
    const payload = verifyRefreshToken(tokens.refreshToken);
    expect(payload.userId).toBe('user-123');
  });
});
