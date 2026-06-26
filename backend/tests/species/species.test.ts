import request from 'supertest';
import { app, initTestEnvironment, resetTestEnvironment, teardownTestEnvironment } from '../utils/testApp';
import { registerUser } from '../utils/authHelpers';

describe('Species Module', () => {
  let accessToken: string;

  beforeAll(async () => {
    await initTestEnvironment();
    const auth = await registerUser('01088888888');
    accessToken = auth.tokens.accessToken;
  });

  afterEach(async () => {
    await resetTestEnvironment();
    const auth = await registerUser('01088888888');
    accessToken = auth.tokens.accessToken;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it('lists seeded Egyptian species', async () => {
    const response = await request(app)
      .get('/api/v1/species')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.species.length).toBeGreaterThan(0);
    const bolty = response.body.species.find(
      (s: any) => s.englishName?.toLowerCase() === 'nile tilapia'
    );
    expect(bolty).toBeDefined();
    expect(bolty.arabicName).toBe('بلطي');
  });

  it('searches by slang name', async () => {
    const response = await request(app)
      .get('/api/v1/species')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ q: 'Denise' })
      .expect(200);

    expect(response.body.species.length).toBeGreaterThan(0);
    expect(response.body.species[0].englishName.toLowerCase()).toContain('bream');
  });

  it('searches by Arabic name', async () => {
    const response = await request(app)
      .get('/api/v1/species')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ q: 'هامور' })
      .expect(200);

    expect(response.body.species.length).toBeGreaterThan(0);
    expect(response.body.species[0].englishName.toLowerCase()).toContain('grouper');
  });

  it('returns a single species by id', async () => {
    const listResponse = await request(app)
      .get('/api/v1/species')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ q: 'Bouri' });

    const speciesId = listResponse.body.species[0].id;

    const response = await request(app)
      .get(`/api/v1/species/${speciesId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.species.englishName.toLowerCase()).toContain('mullet');
  });
});
