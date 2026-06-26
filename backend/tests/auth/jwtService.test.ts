import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/modules/auth/services/jwtService';

describe('JWT Service', () => {
  it('generates and verifies access tokens', () => {
    const tokens = generateTokens({ userId: 'user-123', tier: 'free' });
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const payload = verifyAccessToken(tokens.accessToken);
    expect(payload.userId).toBe('user-123');
    expect(payload.tier).toBe('free');
  });

  it('generates and verifies refresh tokens', () => {
    const tokens = generateTokens({ userId: 'user-123', tier: 'free' });
    const payload = verifyRefreshToken(tokens.refreshToken);
    expect(payload.userId).toBe('user-123');
  });
});
