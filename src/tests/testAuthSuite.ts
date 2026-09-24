/**
 * testAuthSuite.ts
 *
 * Comprehensive Test Suite for BankEase Authentication, Security, and API Endpoints.
 *
 * Covers:
 *  1. Password hashing & comparison (bcrypt)
 *  2. JWT generation & validation (sub claim, expiration)
 *  3. AuthService registration & login business logic
 *  4. AuthMiddleware token verification & security guards
 *  5. End-to-end HTTP API integration (/register, /login, /me, /health)
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';
import {
  registerUser,
  loginUser,
  AuthError,
  UserRepository,
  UserDocument,
} from '../services/authService';
import { authenticateToken } from '../middleware/authMiddleware';
import app from '../server';
import { setTestUserRepository, resetUserRepository } from '../controllers/authController';

// Ensure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_bankease_2026';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

// ── In-Memory Mock Repository for Isolated Unit/API Testing ────────────────────

class MockUserRepository implements UserRepository {
  private users: UserDocument[] = [];
  private idCounter = 1;

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    const found = this.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    return found ? { ...found } : null;
  }

  async findOneByPhone(phone: string): Promise<UserDocument | null> {
    const found = this.users.find(u => u.phone === phone.trim());
    return found ? { ...found } : null;
  }

  async findOneByEmailWithPassword(email: string): Promise<UserDocument | null> {
    const found = this.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    return found ? { ...found } : null;
  }

  async findById(id: string): Promise<UserDocument | null> {
    const found = this.users.find(u => String(u._id) === id);
    return found ? { ...found } : null;
  }

  async createUser(data: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    const doc: UserDocument = {
      _id: `user_${this.idCounter++}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      profileImage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(doc);
    return { ...doc };
  }

  reset() {
    this.users = [];
    this.idCounter = 1;
  }
}

// ─── Test Runners ─────────────────────────────────────────────────────────────

async function testPasswordHashing() {
  console.log('\n--- 1. Testing Password Hashing (bcrypt) ---');
  const plain = 'SecretPassword123!';
  const hash = await hashPassword(plain);

  assert(typeof hash === 'string' && hash.startsWith('$2b$'), 'Password is hashed with bcrypt');
  assert(hash !== plain, 'Hash is not plain text');

  const match = await comparePassword(plain, hash);
  assert(match === true, 'comparePassword returns true for correct password');

  const mismatch = await comparePassword('WrongPassword!', hash);
  assert(mismatch === false, 'comparePassword returns false for incorrect password');
}

async function testJwtUtils() {
  console.log('\n--- 2. Testing JWT Utilities ---');
  const userId = 'usr_test_12345';
  const token = generateAccessToken(userId);

  assert(typeof token === 'string' && token.split('.').length === 3, 'Token is a valid JWT format');

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  assert(decoded.sub === userId, 'JWT sub claim contains the authenticated userId');

  // Verify missing secret rejection
  const origSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  let threw = false;
  try {
    generateAccessToken(userId);
  } catch {
    threw = true;
  }
  assert(threw, 'generateAccessToken throws when JWT_SECRET is missing');
  process.env.JWT_SECRET = origSecret;
}

async function testAuthService() {
  console.log('\n--- 3. Testing AuthService Business Logic ---');
  const repo = new MockUserRepository();

  // Test missing phone
  let threwValidation = false;
  try {
    await registerUser(
      { name: 'Arjun', email: 'arjun@bankease.test', phone: '', password: 'Password123!' },
      repo
    );
  } catch (err: any) {
    threwValidation = err instanceof AuthError && err.message.includes('Phone');
  }
  assert(threwValidation, 'registerUser rejects missing phone');

  // Successful registration
  const regResult = await registerUser(
    { name: 'Arjun Mehta', email: 'arjun@bankease.test', phone: '9800000001', password: 'Password123!' },
    repo
  );
  assert(regResult.user.name === 'Arjun Mehta', 'User registered with correct name');
  assert(regResult.user.email === 'arjun@bankease.test', 'User registered with correct email');
  assert(regResult.user.phone === '9800000001', 'User registered with correct phone');
  assert((regResult.user as any).passwordHash === undefined, 'passwordHash is NEVER returned in user object');
  assert(typeof regResult.token === 'string', 'registerUser returns signed JWT');

  // Test duplicate email
  let duplicateEmail = false;
  try {
    await registerUser(
      { name: 'Duplicate Arjun', email: 'arjun@bankease.test', phone: '9800000002', password: 'Password123!' },
      repo
    );
  } catch (err: any) {
    duplicateEmail = err instanceof AuthError && err.statusCode === 409;
  }
  assert(duplicateEmail, 'Duplicate email registration is rejected with 409');

  // Test duplicate phone
  let duplicatePhone = false;
  try {
    await registerUser(
      { name: 'Other User', email: 'other@bankease.test', phone: '9800000001', password: 'Password123!' },
      repo
    );
  } catch (err: any) {
    duplicatePhone = err instanceof AuthError && err.statusCode === 409;
  }
  assert(duplicatePhone, 'Duplicate phone registration is rejected with 409');

  // Test login with valid credentials
  const loginResult = await loginUser(
    { email: 'arjun@bankease.test', password: 'Password123!' },
    repo
  );
  assert(loginResult.user.id === regResult.user.id, 'loginUser returns correct user');
  assert(typeof loginResult.token === 'string', 'loginUser returns signed JWT');
  assert((loginResult.user as any).passwordHash === undefined, 'loginUser never returns passwordHash');

  const decodedLogin = jwt.verify(loginResult.token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  assert(decodedLogin.sub === regResult.user.id, 'loginUser JWT sub claim contains user.id');

  // Test login with wrong password
  let wrongPass = false;
  try {
    await loginUser({ email: 'arjun@bankease.test', password: 'WrongPassword' }, repo);
  } catch (err: any) {
    wrongPass = err instanceof AuthError && err.message === 'Invalid email or password';
  }
  assert(wrongPass, 'Wrong password returns generic error: "Invalid email or password"');

  // Test login with nonexistent email
  let nonExistent = false;
  try {
    await loginUser({ email: 'nobody@bankease.test', password: 'Password123!' }, repo);
  } catch (err: any) {
    nonExistent = err instanceof AuthError && err.message === 'Invalid email or password';
  }
  assert(nonExistent, 'Nonexistent email returns identical generic error: "Invalid email or password"');
}

async function testAuthMiddleware() {
  console.log('\n--- 4. Testing AuthMiddleware ---');
  const mockNext = () => {};

  // 1. Missing header
  let statusResult = 0;
  let jsonResult: any = null;
  const mockRes1: any = {
    status: (s: number) => {
      statusResult = s;
      return { json: (j: any) => { jsonResult = j; } };
    },
  };
  authenticateToken({ headers: {} } as any, mockRes1, mockNext);
  assert(statusResult === 401 && jsonResult.message === 'Authentication required', 'Missing token rejected with 401');

  // 2. Malformed token format
  statusResult = 0;
  authenticateToken({ headers: { authorization: 'Basic 12345' } } as any, mockRes1, mockNext);
  assert(statusResult === 401 && jsonResult.message === 'Authentication required', 'Non-Bearer header rejected with 401');

  // 3. Invalid / tampered token
  statusResult = 0;
  authenticateToken({ headers: { authorization: 'Bearer invalid.jwt.token' } } as any, mockRes1, mockNext);
  assert(statusResult === 401 && jsonResult.message === 'Invalid or expired token', 'Tampered token rejected with 401');

  // 4. Expired token
  const expiredToken = jwt.sign({ sub: 'usr_123' }, process.env.JWT_SECRET!, { expiresIn: '-1s' });
  statusResult = 0;
  authenticateToken({ headers: { authorization: `Bearer ${expiredToken}` } } as any, mockRes1, mockNext);
  assert(statusResult === 401 && jsonResult.message === 'Invalid or expired token', 'Expired token rejected with 401');

  // 5. Valid token attaches req.userId
  const validToken = generateAccessToken('usr_verified_99');
  let nextCalled: any = false;
  const reqObj: any = { headers: { authorization: `Bearer ${validToken}` } };
  authenticateToken(reqObj, mockRes1, () => { nextCalled = true; });
  assert(nextCalled === true, 'Valid token calls next()');
  assert(reqObj.userId === 'usr_verified_99', 'Middleware sets req.userId from verified JWT sub claim');
}

async function testHttpEndpoints() {
  console.log('\n--- 5. Testing HTTP Endpoints via Express ---');
  const mockRepo = new MockUserRepository();
  setTestUserRepository(mockRepo);

  const TEST_PORT = 5055;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));

  const post = async (path: string, body: any, headers: Record<string, string> = {}) => {
    const res = await fetch(`http://localhost:${TEST_PORT}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const json: any = await res.json();
    return { status: res.status, json };
  };

  const get = async (path: string, headers: Record<string, string> = {}) => {
    const res = await fetch(`http://localhost:${TEST_PORT}${path}`, {
      method: 'GET',
      headers,
    });
    const json: any = await res.json();
    return { status: res.status, json };
  };

  try {
    // Health check
    const health = await get('/health');
    assert(health.status === 200 && health.json.success === true, 'GET /health returns 200 success');

    // Register via HTTP
    const regRes = await post('/api/auth/register', {
      name: 'Priya Sharma',
      email: 'priya@bankease.test',
      phone: '9800000002',
      password: 'StrongPassword123!',
    });
    assert(regRes.status === 201 && regRes.json.success === true, 'POST /api/auth/register returns 201');
    assert(typeof regRes.json.token === 'string', 'Register response contains JWT');
    assert(regRes.json.user.passwordHash === undefined, 'Register response NEVER exposes passwordHash');

    const authToken = regRes.json.token;

    // Login via HTTP
    const loginRes = await post('/api/auth/login', {
      email: 'priya@bankease.test',
      password: 'StrongPassword123!',
    });
    assert(loginRes.status === 200 && loginRes.json.success === true, 'POST /api/auth/login returns 200');
    assert(typeof loginRes.json.token === 'string', 'Login response contains JWT');

    // Login failure via HTTP
    const loginFail = await post('/api/auth/login', {
      email: 'priya@bankease.test',
      password: 'WrongPassword!',
    });
    assert(loginFail.status === 401 && loginFail.json.message === 'Invalid email or password', 'POST /api/auth/login returns 401 with generic message');

    // Protected /me with valid token
    const meRes = await get('/api/auth/me', {
      Authorization: `Bearer ${authToken}`,
    });
    assert(meRes.status === 200 && meRes.json.user.email === 'priya@bankease.test', 'GET /api/auth/me returns authenticated user profile');
    assert(meRes.json.user.passwordHash === undefined, 'GET /api/auth/me NEVER exposes passwordHash');

    // Protected /me without token
    const meNoToken = await get('/api/auth/me');
    assert(meNoToken.status === 401, 'GET /api/auth/me without token returns 401');

    // Protected /me with invalid token
    const meBadToken = await get('/api/auth/me', {
      Authorization: 'Bearer invalid.token.here',
    });
    assert(meBadToken.status === 401, 'GET /api/auth/me with invalid token returns 401');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    resetUserRepository();
  }
}

async function runAll() {
  console.log('====================================================');
  console.log('  BankEase Authentication & Security Test Suite');
  console.log('====================================================');

  try {
    await testPasswordHashing();
    await testJwtUtils();
    await testAuthService();
    await testAuthMiddleware();
    await testHttpEndpoints();

    console.log('\n====================================================');
    console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test suite failed with uncaught exception:', error);
    process.exit(1);
  }
}

runAll();
