/**
 * Smart CV Filter — Backend Integration Tests
 * Tests complete end-to-end API flows using Supertest + MongoDB.
 *
 * REQUIREMENT: MongoDB must be running on localhost:27017
 *
 * Run: npx jest tests/integration.test.js --runInBand --forceExit
 */

require('dotenv').config();
const request  = require('supertest');
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

// ── Route handlers ───────────────────────────────────────────
const authRoutes     = require(path.join(__dirname, '..', 'routes', 'auth'));
const campaignRoutes = require(path.join(__dirname, '..', 'routes', 'campaigns'));
const cvRoutes       = require(path.join(__dirname, '..', 'routes', 'cvs'));

// ── Build test Express app ───────────────────────────────────
function buildApp() {
  const a = express();
  a.use(express.json());
  a.use('/api/auth',      authRoutes);
  a.use('/api/campaigns', campaignRoutes);
  a.use('/api/cvs',       cvRoutes);
  return a;
}

// ── Shared test state ────────────────────────────────────────
let app;
let hrToken;
let testCampaignId;
let testCampaignSlug;
let testCvId;

const TIMESTAMP  = Date.now();
const TEST_USER  = {
  name:     'Test HR Admin',
  email:    `testhr_${TIMESTAMP}@integration.test`,
  password: 'TestPass@12345',
};

// ── Database setup / teardown ────────────────────────────────
beforeAll(async () => {
  const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_cv_filter_test';
  try {
    await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 5000 });
  } catch (e) {
    console.error('MongoDB not available — skipping integration tests.');
    process.exit(0);
  }
  app = buildApp();
}, 15000);

afterAll(async () => {
  try {
    const User     = require(path.join(__dirname, '..', 'models', 'User'));
    const Campaign = require(path.join(__dirname, '..', 'models', 'Campaign'));
    const CV       = require(path.join(__dirname, '..', 'models', 'CV'));
    await User.deleteMany({ email: TEST_USER.email });
    if (testCampaignId) {
      await CV.deleteMany({ campaign: testCampaignId });
      await Campaign.deleteMany({ _id: testCampaignId });
    }
  } catch { /* ignore cleanup errors */ }
  await mongoose.connection.close();
}, 10000);

// ============================================================
// FLOW 1: HR Authentication
// ============================================================
describe('Flow 1 — HR Authentication', () => {

  it('POST /api/auth/register — creates new HR admin account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER)
      .set('Accept', 'application/json');

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    hrToken = res.body.token;
  });

  it('POST /api/auth/register — rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('POST /api/auth/login — successful login returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    hrToken = res.body.token; // refresh
  });

  it('POST /api/auth/login — rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'WrongPassword123' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me — returns logged-in user info', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it('GET /api/auth/me — returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ============================================================
// FLOW 2: Campaign Management
// ============================================================
describe('Flow 2 — Job Campaign Management', () => {

  const CAMPAIGN_DATA = {
    position:                  'Integration Test Engineer',
    department:                'QA Engineering',
    jobDescription:            'Write and maintain integration test suites for the platform.',
    companyExpectations:       'Attention to detail and software quality mindset.',
    candidateResponsibilities: 'Design test cases and automate regression tests.',
    requiredSkills:            ['Jest', 'Python', 'Supertest'],
    requiredQualifications:    'BSc in Software Engineering or equivalent.',
  };

  it('POST /api/campaigns — creates campaign (auth required)', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${hrToken}`)
      .send(CAMPAIGN_DATA);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.campaign.slug).toBeTruthy();
    expect(res.body.campaign.position).toBe('Integration Test Engineer');
    testCampaignId   = res.body.campaign._id;
    testCampaignSlug = res.body.campaign.slug;
  });

  it('POST /api/campaigns — returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .send(CAMPAIGN_DATA);
    expect(res.status).toBe(401);
  });

  it('GET /api/campaigns — lists HR admin campaigns', async () => {
    const res = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.campaigns)).toBe(true);
    expect(res.body.campaigns.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/campaigns/public/:slug — public route loads campaign', async () => {
    const res = await request(app)
      .get(`/api/campaigns/public/${testCampaignSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.campaign.position).toBe('Integration Test Engineer');
  });

  it('GET /api/campaigns/:id — returns campaign detail with cvs', async () => {
    const res = await request(app)
      .get(`/api/campaigns/${testCampaignId}`)
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.campaign._id).toBe(testCampaignId);
    expect(Array.isArray(res.body.cvs)).toBe(true);
  });

  it('PUT /api/campaigns/:id — updates campaign department', async () => {
    const res = await request(app)
      .put(`/api/campaigns/${testCampaignId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ department: 'Updated QA' });
    expect(res.status).toBe(200);
    expect(res.body.campaign.department).toBe('Updated QA');
  });
});

// ============================================================
// FLOW 3: Candidate Application Submission
// ============================================================
describe('Flow 3 — Candidate Application (Public)', () => {

  it('POST /api/cvs/submit/:slug — submits complete application', async () => {
    const res = await request(app)
      .post(`/api/cvs/submit/${testCampaignSlug}`)
      .field('fullName',            'Nimasha Perera')
      .field('gender',              'Female')
      .field('address',             'No. 12, Kandy Road, Peradeniya')
      .field('email',               `nimasha_${TIMESTAMP}@example.lk`)
      .field('phone',               '+94712345678')
      .field('educationalInstitute', 'University of Peradeniya')
      .field('degree',              'BSc Computer Science')
      .field('graduationYear',      '2025')
      .field('skills',              'Jest, Python, Selenium, English, Sinhala')
      .field('whyHireYou',          'I have 2 years of QA automation experience with strong attention to detail.');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.cvId).toBeTruthy();
    testCvId = res.body.cvId;
  }, 10000);

  it('POST /api/cvs/submit/:slug — rejects submission to closed/invalid campaign', async () => {
    const res = await request(app)
      .post('/api/cvs/submit/invalid_slug_doesnotexist_000')
      .field('fullName', 'Ghost User')
      .field('gender', 'Male')
      .field('address', 'N/A')
      .field('email', 'ghost@example.com')
      .field('skills', 'Python')
      .field('whyHireYou', 'Test');
    expect(res.status).toBe(404);
  });

  it('GET /api/campaigns/:id — applicationCount incremented after submission', async () => {
    await new Promise(r => setTimeout(r, 400)); // let DB write
    const res = await request(app)
      .get(`/api/campaigns/${testCampaignId}`)
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.body.cvs.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// FLOW 4: CV Status Management
// ============================================================
describe('Flow 4 — CV Status Management', () => {

  const statuses = ['applied', 'shortlisted', 'interview', 'selected', 'rejected', 'reviewed', 'new'];

  statuses.forEach(status => {
    it(`PUT /api/cvs/:id/status — updates to "${status}"`, async () => {
      if (!testCvId) return;
      const res = await request(app)
        .put(`/api/cvs/${testCvId}/status`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.cv.status).toBe(status);
    });
  });

  it('PUT /api/cvs/:id/status — rejects invalid status "invalid_stage"', async () => {
    if (!testCvId) return;
    const res = await request(app)
      .put(`/api/cvs/${testCvId}/status`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'invalid_stage' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/cvs/:id/status — returns 401 without token', async () => {
    if (!testCvId) return;
    const res = await request(app)
      .put(`/api/cvs/${testCvId}/status`)
      .send({ status: 'shortlisted' });
    expect(res.status).toBe(401);
  });
});

// ============================================================
// FLOW 5: CRM Notes and Ratings
// ============================================================
describe('Flow 5 — CRM Notes and Ratings', () => {

  it('PUT /api/cvs/:id/rating — updates candidate rating successfully', async () => {
    if (!testCvId) return;
    const res = await request(app)
      .put(`/api/cvs/${testCvId}/rating`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ rating: 4 });
    expect(res.status).toBe(200);
    expect(res.body.cv.rating).toBe(4);
  });

  it('PUT /api/cvs/:id/rating — rejects invalid rating (e.g. 10)', async () => {
    if (!testCvId) return;
    const res = await request(app)
      .put(`/api/cvs/${testCvId}/rating`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ rating: 10 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/cvs/:id/notes — adds recruiter notes successfully', async () => {
    if (!testCvId) return;
    const res = await request(app)
      .post(`/api/cvs/${testCvId}/notes`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ text: 'Excellent candidate, passed initial interview!' });
    expect(res.status).toBe(200);
    expect(res.body.cv.notes.length).toBe(1);
    expect(res.body.cv.notes[0].text).toBe('Excellent candidate, passed initial interview!');
  });
});
