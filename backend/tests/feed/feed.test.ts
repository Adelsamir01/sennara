import request from 'supertest';
import { app, initTestEnvironment, resetTestEnvironment, teardownTestEnvironment } from '../utils/testApp';
import { registerUser } from '../utils/authHelpers';
import { query } from '../../src/config/database';

describe('Feed / Social Module', () => {
  let accessToken: string;
  let userId: string;
  let speciesId: string;
  let catchId: string;

  beforeAll(async () => {
    await initTestEnvironment();
  });

  beforeEach(async () => {
    const auth = await registerUser('01055555555');
    accessToken = auth.tokens.accessToken;
    userId = auth.user.id as string;

    const speciesResult = await query('SELECT id FROM species LIMIT 1');
    speciesId = speciesResult.rows[0].id;

    const catchResponse = await request(app)
      .post('/api/v1/catches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        speciesId,
        privacy: 'public',
        latitude: 27.2579,
        longitude: 33.8116,
      });

    catchId = catchResponse.body.catch.id;
  });

  afterEach(async () => {
    await resetTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it('toggles like on a catch', async () => {
    const likeResponse = await request(app)
      .post(`/api/v1/feed/catches/${catchId}/like`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(likeResponse.body.liked).toBe(true);
    expect(likeResponse.body.likes).toBe(1);

    const unlikeResponse = await request(app)
      .post(`/api/v1/feed/catches/${catchId}/like`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(unlikeResponse.body.liked).toBe(false);
    expect(unlikeResponse.body.likes).toBe(0);
  });

  it('adds and lists comments', async () => {
    const commentResponse = await request(app)
      .post(`/api/v1/feed/catches/${catchId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'Nice catch!' })
      .expect(201);

    expect(commentResponse.body.comment.content).toBe('Nice catch!');
    expect(commentResponse.body.comments).toBe(1);

    const listResponse = await request(app)
      .get(`/api/v1/feed/catches/${catchId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listResponse.body.comments).toHaveLength(1);
  });

  it('records a share', async () => {
    const response = await request(app)
      .post(`/api/v1/feed/catches/${catchId}/share`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ platform: 'whatsapp' })
      .expect(201);

    expect(response.body.shares).toBe(1);
  });

  it('manages friendships', async () => {
    const otherAuth = await registerUser('01066666666');

    await request(app)
      .post('/api/v1/feed/friendships/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId: otherAuth.user.id })
      .expect(201);

    await request(app)
      .patch(`/api/v1/feed/friendships/${userId}/respond`)
      .set('Authorization', `Bearer ${otherAuth.tokens.accessToken}`)
      .send({ status: 'accepted' })
      .expect(200);

    const listResponse = await request(app)
      .get('/api/v1/feed/friendships')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ status: 'accepted' })
      .expect(200);

    expect(listResponse.body.friendships).toHaveLength(1);
  });
});
