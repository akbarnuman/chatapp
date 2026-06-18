const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Auth API', () => {
  const user = { username: 'testuser', email: 'test@example.com', password: 'password123' };
  let token;

  test('POST /api/auth/register - registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
  });

  test('POST /api/auth/register - rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/login - logs in successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('POST /api/auth/login - rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me - returns current user', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.username).toBe(user.username);
  });

  test('GET /api/auth/me - fails without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('Users API', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'password123' });
    token = res.body.token;
  });

  test('GET /api/users - returns user list', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  test('GET /api/users - search by username', async () => {
    const res = await request(app).get('/api/users?search=test').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});

describe('Conversations API', () => {
  let token, userId2, conversationId;

  beforeAll(async () => {
    const reg = await request(app).post('/api/auth/register').send({ username: 'user2', email: 'user2@test.com', password: 'password123' });
    userId2 = reg.body.user._id;
    const login = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'password123' });
    token = login.body.token;
  });

  test('POST /api/conversations - creates DM conversation', async () => {
    const res = await request(app).post('/api/conversations').set('Authorization', `Bearer ${token}`).send({ participantId: userId2 });
    expect(res.statusCode).toBe(201);
    expect(res.body.conversation._id).toBeDefined();
    conversationId = res.body.conversation._id;
  });

  test('GET /api/conversations - returns conversations', async () => {
    const res = await request(app).get('/api/conversations').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.conversations)).toBe(true);
  });
});
