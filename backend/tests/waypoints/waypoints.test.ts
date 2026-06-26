import request from 'supertest';
import { app, initTestEnvironment, resetTestEnvironment, teardownTestEnvironment } from '../utils/testApp';
import { registerUser } from '../utils/authHelpers';

describe('Waypoint Module', () => {
  let accessToken: string;

  beforeAll(async () => {
    await initTestEnvironment();
    const auth = await registerUser('01011111111');
    accessToken = auth.tokens.accessToken;
  });

  afterEach(async () => {
    await resetTestEnvironment();
    const auth = await registerUser('01011111111');
    accessToken = auth.tokens.accessToken;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it('creates a waypoint at GPS coordinates', async () => {
    const response = await request(app)
      .post('/api/v1/waypoints')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Red Sea Reef',
        latitude: 27.2579,
        longitude: 33.8116,
        privacy: 'public',
        waypointType: 'reef',
      })
      .expect(201);

    expect(response.body.waypoint).toBeDefined();
    expect(response.body.waypoint.name).toBe('Red Sea Reef');
    expect(response.body.waypoint.location.latitude).toBeCloseTo(27.2579, 3);
  });

  it('lists nearby waypoints with privacy filtering', async () => {
    // Create a public waypoint
    await request(app)
      .post('/api/v1/waypoints')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Public Spot',
        latitude: 27.2579,
        longitude: 33.8116,
        privacy: 'public',
      });

    // Create a secret waypoint
    await request(app)
      .post('/api/v1/waypoints')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Secret Spot',
        latitude: 27.2579,
        longitude: 33.8116,
        privacy: 'secret',
      });

    const response = await request(app)
      .get('/api/v1/waypoints/nearby')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ lat: 27.2579, lng: 33.8116, radiusKm: 1 })
      .expect(200);

    expect(response.body.waypoints).toHaveLength(2);
  });

  it('prevents other users from seeing secret waypoints', async () => {
    const otherAuth = await registerUser('01022222222');

    await request(app)
      .post('/api/v1/waypoints')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Secret Spot',
        latitude: 27.2579,
        longitude: 33.8116,
        privacy: 'secret',
      });

    const response = await request(app)
      .get('/api/v1/waypoints/nearby')
      .set('Authorization', `Bearer ${otherAuth.tokens.accessToken}`)
      .query({ lat: 27.2579, lng: 33.8116, radiusKm: 1 })
      .expect(200);

    expect(response.body.waypoints).toHaveLength(0);
  });

  it('updates and deletes a waypoint', async () => {
    const createResponse = await request(app)
      .post('/api/v1/waypoints')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Old Name',
        latitude: 27.2579,
        longitude: 33.8116,
      });

    const waypointId = createResponse.body.waypoint.id;

    const updateResponse = await request(app)
      .patch(`/api/v1/waypoints/${waypointId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'New Name' })
      .expect(200);

    expect(updateResponse.body.waypoint.name).toBe('New Name');

    await request(app)
      .delete(`/api/v1/waypoints/${waypointId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app)
      .get(`/api/v1/waypoints/${waypointId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
