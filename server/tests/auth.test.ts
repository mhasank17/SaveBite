process.env.NODE_ENV = 'test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';
import authService from '../src/services/authService';
import emailService from '../src/services/emailService';

// Configure mock transporter for unit tests so they execute fast and independently of external SMTP.
let deliveredOtp = '';
emailService.setTransporter({
  sendMail: async (mail: any) => {
    deliveredOtp = String(mail.text).match(/code is (\d{6})/)?.[1] || '';
    return {
    messageId: '<test-message-id@savebite.in>',
    response: '250 2.0.0 OK: message accepted',
    };
  },
  verify: async () => true,
} as any);

const app = createApp();

describe('Auth & Student Registration API Gates', () => {
  const uniqueTimestamp = Date.now();
  const testStudent = {
    fullName: 'Priya Sharma',
    email: `priya.sharma.${uniqueTimestamp}@university.edu`,
    password: 'SecurePassword123!',
    phone: '+919876543210',
  };

  // 1. Successful student registration
  it('1. should successfully register a new student and return 201 with valid JSON and token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/customer/register')
      .send(testStudent);

    assert.equal(res.status, 201);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /Customer account registered successfully/);
    assert.ok(res.body.data);
    assert.ok(res.body.data.token);
    assert.ok(res.body.data.user);
    assert.equal(res.body.data.user.email, testStudent.email.toLowerCase());
    assert.equal(res.body.data.user.fullName, testStudent.fullName);
    assert.equal(res.body.data.user.role, 'CUSTOMER');
    assert.equal(typeof res.body.data.user.id, 'string');
    assert.ok(res.body.data.user.avatarUrl, 'User should have an automatically assigned avatarUrl');
    assert.match(res.body.data.user.avatarUrl, /api\.dicebear\.com/);
  });

  // 2. Duplicate email registration
  it('2. should reject registration with duplicate email and return 409 Conflict with valid JSON', async () => {
    const res = await request(app)
      .post('/api/v1/auth/customer/register')
      .send(testStudent);

    assert.equal(res.status, 409);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  // 3. Validation failure: Invalid email format
  it('3. should reject registration with invalid email format and return 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/customer/register')
      .send({
        fullName: 'Invalid Email Student',
        email: 'invalid-email-string',
        password: 'ValidPassword123!',
      });

    assert.equal(res.status, 400);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /valid email address/i);
  });

  // 4. Validation failure: Short password
  it('4. should reject registration with password shorter than 6 characters and return 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/customer/register')
      .send({
        fullName: 'Short Password Student',
        email: `shortpw.${Date.now()}@university.edu`,
        password: '123',
      });

    assert.equal(res.status, 400);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /at least 6 characters/i);
  });

  // 5. Validation failure: Short full name
  it('5. should reject registration with full name shorter than 2 characters and return 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/customer/register')
      .send({
        fullName: 'A',
        email: `shortname.${Date.now()}@university.edu`,
        password: 'ValidPassword123!',
      });

    assert.equal(res.status, 400);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /at least 2 characters/i);
  });

  // 6. Empty request body handling
  it('6. should reject empty request body with 400 Bad Request and valid JSON', async () => {
    const res = await request(app)
      .post('/api/v1/auth/customer/register')
      .send({});

    assert.equal(res.status, 400);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message);
  });

  // 7. Malformed JSON payload handling
  it('7. should handle malformed JSON payload gracefully with 400 Bad Request and valid JSON', async () => {
    const res = await request(app)
      .post('/api/v1/auth/customer/register')
      .set('Content-Type', 'application/json')
      .send('{"fullName": "Broken JSON');

    assert.equal(res.status, 400);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /JSON/i);
  });

  // 8. Server failure resilience
  it('8. should return valid JSON with 500 when server encounters an unexpected error during registration', async () => {
    // Temporarily mock registerCustomer to simulate internal database/server crash
    const originalRegister = authService.registerCustomer.bind(authService);
    (authService as any).registerCustomer = async () => {
      throw new Error('Database connection pool exhausted.');
    };

    try {
      const res = await request(app)
        .post('/api/v1/auth/customer/register')
        .send({
          fullName: 'Crash Test User',
          email: `crashtest.${Date.now()}@university.edu`,
          password: 'Password123!',
        });

      assert.equal(res.status, 500);
      assert.match(res.headers['content-type'], /application\/json/);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Database connection pool exhausted.');
    } finally {
      (authService as any).registerCustomer = originalRegister;
    }
  });

  // 9. Unmatched API route returns valid JSON 404
  it('9. should return 404 with valid JSON for non-existent API routes', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    assert.equal(res.status, 404);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(res.body.success, false);
  });

  // 10. Avatar update requires authentication
  it('10. should reject avatar update without authorization header with 401 Unauthorized', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/avatar')
      .send({ avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 11. Authenticated customer can update and persist their avatar
  it('11. should allow authenticated customer to update their avatar and return updated user', async () => {
    // Login with student
    const loginRes = await request(app)
      .post('/api/v1/auth/customer/login')
      .send({ email: testStudent.email, password: testStudent.password });

    assert.equal(loginRes.status, 200);
    const token = loginRes.body.data.token;
    const newAvatar = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=b6e3f4';

    const updateRes = await request(app)
      .patch('/api/v1/auth/avatar')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarUrl: newAvatar });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.success, true);
    assert.equal(updateRes.body.data.user.avatarUrl, newAvatar);

    // Verify persistence via /auth/me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.user.avatarUrl, newAvatar);
  });

  // 12. Reject invalid avatar URL
  it('12. should reject invalid avatar URL format with 400 Bad Request', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/customer/login')
      .send({ email: testStudent.email, password: testStudent.password });

    const token = loginRes.body.data.token;

    const updateRes = await request(app)
      .patch('/api/v1/auth/avatar')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarUrl: 'not-a-valid-url' });

    assert.equal(updateRes.status, 400);
    assert.equal(updateRes.body.success, false);
  });

  it('13. requests an OTP without exposing it in the API response', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testStudent.email });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /verification code has been sent/i);
    assert.equal(res.body.otp, undefined);
    assert.equal(res.body.devToken, undefined);
    assert.match(deliveredOtp, /^\d{6}$/);
  });

  it('14. preserves anti-enumeration for unknown email addresses', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent-user-xyz@savebite.in' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /verification code has been sent/i);
    assert.equal(res.body.otp, undefined);
  });

  // 15. Invalid email format for forgot password
  it('15. should reject forgot password with invalid email format and return 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-an-email' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /valid email address/i);
  });

  const newPassword = 'BrandNewPassword456!';
  let resetToken = '';
  it('16. rejects an invalid OTP, verifies a valid OTP, resets password, and permits login with it', async () => {
    const bad = await request(app).post('/api/v1/auth/verify-password-otp').send({ email: testStudent.email, otp: '000000' });
    if (deliveredOtp !== '000000') assert.equal(bad.status, 400);
    const verify = await request(app).post('/api/v1/auth/verify-password-otp').send({ email: testStudent.email, otp: deliveredOtp });
    assert.equal(verify.status, 200);
    resetToken = verify.body.resetToken;
    assert.ok(resetToken);
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /password has been successfully reset/i);
  });

  it('17. invalidates the verified reset token after use', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'AnotherPassword789!',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /verification expired/i);
  });

  it('18. rejects invalid reset tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: 'fake-token-1234567890abcdef',
        newPassword: 'AnotherPassword789!',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /verification expired/i);
  });

  it('19. login with the new password succeeds', async () => {
    // Old password should fail
    const oldLoginRes = await request(app)
      .post('/api/v1/auth/customer/login')
      .send({ email: testStudent.email, password: testStudent.password });

    assert.equal(oldLoginRes.status, 401);

    // New password should succeed
    const newLoginRes = await request(app)
      .post('/api/v1/auth/customer/login')
      .send({ email: testStudent.email, password: newPassword });

    assert.equal(newLoginRes.status, 200);
    assert.equal(newLoginRes.body.success, true);
    assert.ok(newLoginRes.body.data.token);
  });

  it('20. rate limits repeated OTP requests', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: testStudent.email });
    assert.equal(res.status, 503);
    assert.match(res.body.message, /wait 60 seconds/i);
  });
});
