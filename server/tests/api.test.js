const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock the entire db module so Prisma never hits a real database
jest.mock('../src/utils/db', () => {
  const original = jest.requireActual('../src/utils/db');
  return {
    ...original,
    prisma: {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      subscription: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0)
      },
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0)
      },
      costHistory: {
        create: jest.fn()
      }
    }
  };
});

const { prisma } = require('../src/utils/db');

// Set JWT secrets before importing app (authController reads them)
process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-at-least-32-chars-long';

const app = require('../src/index');

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Auth Routes ────────────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('should create a user and return tokens', async () => {
      const mockUser = {
        id: 'user-123',
        firstName: 'Omkar',
        lastName: 'Patil',
        email: 'omkar@example.com',
        password: 'hashedpw',
        plan: 'starter',
        isActive: true
      };

      prisma.user.findUnique.mockResolvedValue(null); // no existing user
      prisma.user.create.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Omkar',
          lastName: 'Patil',
          email: 'omkar@example.com',
          password: 'securePassword123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.firstName).toBe('Omkar');
      expect(res.body.user.password).toBeUndefined(); // toPublicJSON strips it
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should reject if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'dup@test.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Dup',
          lastName: 'User',
          email: 'dup@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Email already registered.');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'only@email.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('All fields are required.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate password and return tokens', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      const mockUser = {
        id: 'user-456',
        firstName: 'Omkar',
        lastName: 'Patil',
        email: 'omkar@example.com',
        password: hashedPassword,
        plan: 'starter',
        isActive: true
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, lastLogin: new Date() });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'omkar@example.com', password: plainPassword });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(prisma.user.update).toHaveBeenCalled(); // lastLogin updated
    });

    it('should reject wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 12);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-456',
        email: 'omkar@example.com',
        password: hashedPassword
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'omkar@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials.');
    });

    it('should reject nonexistent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'anything' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials.');
    });
  });

  // ─── Auth Middleware ────────────────────────────────────────────────

  describe('JWT Auth Middleware', () => {
    it('should reject requests without authorization header', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/No token/);
    });

    it('should reject expired tokens', async () => {
      const token = jwt.sign(
        { id: 'user-1' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // already expired
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should accept valid JWT and return user profile', async () => {
      const mockUser = {
        id: 'user-123',
        firstName: 'Omkar',
        lastName: 'Patil',
        email: 'omkar@example.com',
        isActive: true,
        plan: 'starter'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const token = jwt.sign(
        { id: 'user-123', email: 'omkar@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('omkar@example.com');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject deactivated user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-disabled',
        email: 'disabled@test.com',
        isActive: false
      });

      const token = jwt.sign(
        { id: 'user-disabled' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/deactivated/);
    });
  });

  // ─── Subscriptions ─────────────────────────────────────────────────

  describe('Subscription Routes (authenticated)', () => {
    let token;
    const mockUser = {
      id: 'user-sub-test',
      firstName: 'Test',
      lastName: 'User',
      email: 'sub@test.com',
      isActive: true,
      plan: 'starter'
    };

    beforeEach(() => {
      token = jwt.sign(
        { id: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      prisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it('GET /api/subscriptions - should return user subscriptions list', async () => {
      const mockSubs = [
        {
          id: 'sub-1',
          userId: mockUser.id,
          name: 'Netflix',
          cost: 199,
          billingCycle: 'Monthly',
          renewalDate: new Date(),
          status: 'Active',
          category: 'Entertainment',
          usageStats: {},
          aiAnalysis: {},
          tags: [],
          remindersSent: [],
          costHistory: []
        }
      ];

      prisma.subscription.findMany.mockResolvedValue(mockSubs);
      prisma.subscription.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Netflix');
      expect(res.body.data[0].monthlyCost).toBeDefined(); // virtual field added
    });

    it('POST /api/subscriptions - should create a new subscription', async () => {
      const renewalDate = new Date(Date.now() + 30 * 86400000);
      const mockCreated = {
        id: 'sub-new',
        userId: mockUser.id,
        name: 'Spotify',
        cost: 99,
        billingCycle: 'Monthly',
        renewalDate,
        status: 'Active',
        category: 'Entertainment',
        usageStats: {},
        aiAnalysis: {},
        tags: [],
        remindersSent: [],
        costHistory: []
      };

      prisma.subscription.create.mockResolvedValue(mockCreated);
      prisma.notification.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Spotify',
          cost: 99,
          billingCycle: 'Monthly',
          renewalDate: renewalDate.toISOString(),
          category: 'Entertainment'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Spotify');
      expect(prisma.subscription.create).toHaveBeenCalledTimes(1);
      expect(prisma.notification.create).toHaveBeenCalledTimes(1); // notification created
    });

    it('DELETE /api/subscriptions/:id - should delete a subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-del',
        userId: mockUser.id,
        name: 'DeleteMe'
      });
      prisma.subscription.delete.mockResolvedValue({});

      const res = await request(app)
        .delete('/api/subscriptions/sub-del')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Subscription deleted.');
    });
  });

  // ─── Notifications ─────────────────────────────────────────────────

  describe('Notification Routes (authenticated)', () => {
    let token;
    const mockUser = {
      id: 'user-notif-test',
      firstName: 'Notif',
      lastName: 'User',
      email: 'notif@test.com',
      isActive: true,
      plan: 'starter'
    };

    beforeEach(() => {
      token = jwt.sign(
        { id: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      prisma.user.findUnique.mockResolvedValue(mockUser);
    });

    it('GET /api/notifications - should return notifications list', async () => {
      prisma.notification.findMany.mockResolvedValue([
        { id: 'n1', title: 'Renewal Alert', isRead: false }
      ]);
      prisma.notification.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('PATCH /api/notifications/mark-all-read - should mark all as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const res = await request(app)
        .patch('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('All notifications marked as read.');
    });
  });

  // ─── Health Check ──────────────────────────────────────────────────

  describe('Health & Routing', () => {
    it('GET /api/health - should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('SubSync API is running');
    });

    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
