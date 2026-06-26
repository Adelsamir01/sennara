import request from 'supertest';
import { app, initTestEnvironment, resetTestEnvironment, teardownTestEnvironment } from '../utils/testApp';
import { registerUser } from '../utils/authHelpers';
import { query } from '../../src/config/database';

describe('Catch Module', () => {
  let accessToken: string;
  let speciesId: string;

  beforeAll(async () => {
    await initTestEnvironment();
    const auth = await registerUser('01033333333');
    accessToken = auth.tokens.accessToken;

    const result = await query('SELECT id FROM species LIMIT 1');
    speciesId = result.rows[0].id;
  });

  afterEach(async () => {
    await resetTestEnvironment();
    const auth = await registerUser('01033333333');
    accessToken = auth.tokens.accessToken;

    const result = await query('SELECT id FROM species LIMIT 1');
    speciesId = result.rows[0].id;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it('creates a catch with species and GPS coordinates', async () => {
    const response = await request(app)
      .post('/api/v1/catches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        speciesId,
        weightKg: 2.5,
        lengthCm: 45,
        baitType: 'shrimp',
        privacy: 'public',
        latitude: 27.2579,
        longitude: 33.8116,
      })
      .expect(201);

    expect(response.body.catch).toBeDefined();
    expect(response.body.catch.weightKg).toBe(2.5);
    expect(response.body.catch.species.id).toBe(speciesId);
    expect(response.body.catch.location.latitude).toBeCloseTo(27.2579, 3);
  });

  it('returns public catches in feed', async () => {
    await request(app)
      .post('/api/v1/catches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        speciesId,
        privacy: 'public',
        latitude: 27.2579,
        longitude: 33.8116,
      });

    const response = await request(app)
      .get('/api/v1/catches')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ feed: 'nearby', lat: 27.2579, lng: 33.8116, radiusKm: 1 })
      .expect(200);

    expect(response.body.catches).toHaveLength(1);
    expect(response.body.catches[0].privacy).toBe('public');
  });

  it('obfuscates exact location for free users viewing public catches', async () => {
    const otherAuth = await registerUser('01044444444');

    await request(app)
      .post('/api/v1/catches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        speciesId,
        privacy: 'public',
        latitude: 27.257895,
        longitude: 33.811612,
      });

    const response = await request(app)
      .get('/api/v1/catches')
      .set('Authorization', `Bearer ${otherAuth.tokens.accessToken}`)
      .query({ feed: 'nearby', lat: 27.2579, lng: 33.8116, radiusKm: 1 })
      .expect(200);

    const location = response.body.catches[0].location;
    // Free user should see ~2 decimal places, not full precision
    expect(location.latitude).not.toBeCloseTo(27.257895, 5);
  });

  it('allows owner to see exact location regardless of tier', async () => {
    const response = await request(app)
      .post('/api/v1/catches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        speciesId,
        privacy: 'public',
        latitude: 27.257895,
        longitude: 33.811612,
      });

    const catchId = response.body.catch.id;

    const getResponse = await request(app)
      .get(`/api/v1/catches/${catchId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(getResponse.body.catch.location.latitude).toBeCloseTo(27.257895, 5);
  });
});
