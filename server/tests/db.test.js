const { toPublicJSON, addVirtualFields, addVirtualsToList } = require('../src/utils/db');

describe('Database Utility Helpers', () => {
  describe('toPublicJSON', () => {
    it('should remove sensitive fields from user object', () => {
      const user = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashed-password-here',
        resetPasswordToken: 'reset-token-here',
        resetPasswordExpire: new Date(),
        emailVerifyToken: 'verify-token-here',
        company: '{"name":"Acme Corp","gst":"12345","address":"123 Main St"}',
        preferences: '{"currency":"USD","theme":"light","emailNotifications":true}'
      };

      const result = toPublicJSON(user);

      expect(result.password).toBeUndefined();
      expect(result.resetPasswordToken).toBeUndefined();
      expect(result.resetPasswordExpire).toBeUndefined();
      expect(result.emailVerifyToken).toBeUndefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.fullName).toBe('John Doe');
      expect(result.company).toEqual({
        name: 'Acme Corp',
        gst: '12345',
        address: '123 Main St'
      });
      expect(result.preferences).toEqual({
        currency: 'USD',
        theme: 'light',
        emailNotifications: true
      });
    });

    it('should handle missing firstName/lastName gracefully', () => {
      const user = {
        id: 'user-2',
        email: 'no-name@example.com'
      };

      const result = toPublicJSON(user);
      expect(result.fullName).toBe('');
    });
  });

  describe('addVirtualFields', () => {
    it('should compute monthlyCost and annualCost for Monthly billing cycle', () => {
      const sub = {
        name: 'Netflix',
        cost: 100,
        billingCycle: 'Monthly',
        renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      };

      const result = addVirtualFields(sub);
      expect(result.monthlyCost).toBe(100);
      expect(result.annualCost).toBe(1200);
    });

    it('should compute monthlyCost and annualCost for Annual billing cycle', () => {
      const sub = {
        name: 'Prime Video',
        cost: 1200,
        billingCycle: 'Annual',
        renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      };

      const result = addVirtualFields(sub);
      expect(result.monthlyCost).toBe(100);
      expect(result.annualCost).toBe(1200);
    });

    it('should compute monthlyCost and annualCost for Quarterly billing cycle', () => {
      const sub = {
        name: 'Adobe Creative Cloud',
        cost: 300,
        billingCycle: 'Quarterly',
        renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      };

      const result = addVirtualFields(sub);
      expect(result.monthlyCost).toBe(100);
      expect(result.annualCost).toBe(1200);
    });

    it('should compute monthlyCost and annualCost for Weekly billing cycle', () => {
      const sub = {
        name: 'News Subscription',
        cost: 10,
        billingCycle: 'Weekly',
        renewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      };

      const result = addVirtualFields(sub);
      expect(result.monthlyCost).toBe(43); // Math.round(10 * 4.33)
      expect(result.annualCost).toBe(520); // Math.round(10 * 52)
    });

    it('should compute daysUntilRenewal correctly', () => {
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);

      const sub = {
        name: 'Spotify',
        cost: 99,
        billingCycle: 'Monthly',
        renewalDate: fiveDaysLater
      };

      const result = addVirtualFields(sub);
      expect(result.daysUntilRenewal).toBe(5);
    });

    it('should parse JSON columns stored as text/string fields', () => {
      const sub = {
        name: 'Slack',
        cost: 100,
        billingCycle: 'Monthly',
        renewalDate: new Date(),
        usageStats: '{"lastUsed":"2026-07-20T00:00:00.000Z","usageScore":85}',
        aiAnalysis: '{"isUnused":false,"riskScore":10}',
        tags: '["productivity","communication"]',
        remindersSent: '["2026-07-15T00:00:00.000Z"]'
      };

      const result = addVirtualFields(sub);
      expect(result.usageStats).toEqual({ lastUsed: '2026-07-20T00:00:00.000Z', usageScore: 85 });
      expect(result.aiAnalysis).toEqual({ isUnused: false, riskScore: 10 });
      expect(result.tags).toEqual(['productivity', 'communication']);
      expect(result.remindersSent).toEqual(['2026-07-15T00:00:00.000Z']);
    });
  });

  describe('addVirtualsToList', () => {
    it('should compute virtual fields for an array of subscriptions', () => {
      const list = [
        { name: 'A', cost: 10, billingCycle: 'Monthly', renewalDate: new Date() },
        { name: 'B', cost: 120, billingCycle: 'Annual', renewalDate: new Date() }
      ];

      const result = addVirtualsToList(list);
      expect(result[0].monthlyCost).toBe(10);
      expect(result[1].monthlyCost).toBe(10);
    });

    it('should return empty list if array is not provided', () => {
      expect(addVirtualsToList(null)).toEqual([]);
      expect(addVirtualsToList(undefined)).toEqual([]);
    });
  });
});
