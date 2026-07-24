/**
 * Phase 4A — Marketplace Service Tests
 * Tests: listings, purchase flow, ratings, withdrawal, moderation, seller stats
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { paperBankMarketplaceService } from '../services/paperBankMarketplaceService';


// localStorage mock is provided by jest.config.ts (jsdom environment)
beforeEach(() => {
  localStorage.clear();
});

describe('Marketplace Service — Phase 4', () => {
  describe('getMarketplaceListings', () => {
    it('returns only APPROVED listings', async () => {
      const listings = await paperBankMarketplaceService.getMarketplaceListings();
      expect(listings.every((l) => l.moderationStatus === 'APPROVED')).toBe(true);
    });

    it('filters by subject', async () => {
      const maths = await paperBankMarketplaceService.getMarketplaceListings('Mathematics');
      expect(maths.every((l) => l.subject === 'Mathematics')).toBe(true);
    });

    it('filters by grade', async () => {
      const form4 = await paperBankMarketplaceService.getMarketplaceListings(undefined, 'Form 4');
      expect(form4.every((l) => l.grade === 'Form 4')).toBe(true);
    });
  });

  describe('getFeaturedListings', () => {
    it('returns at most N listings', async () => {
      const featured = await paperBankMarketplaceService.getFeaturedListings(2);
      expect(featured.length).toBeLessThanOrEqual(2);
    });

    it('returns listings sorted by salesCount desc', async () => {
      const featured = await paperBankMarketplaceService.getFeaturedListings(3);
      for (let i = 0; i < featured.length - 1; i++) {
        expect(featured[i].salesCount).toBeGreaterThanOrEqual(featured[i + 1].salesCount);
      }
    });
  });

  describe('recordSellerSale', () => {
    it('correctly updates seller wallet balance (70% split)', () => {
      const priceKes = 100;
      const initial = paperBankMarketplaceService.getSellerWallet('test_seller_001');
      const initialBalance = initial.availableBalanceKes;
      paperBankMarketplaceService.recordSellerSale('test_seller_001', priceKes, 70);
      const updated = paperBankMarketplaceService.getSellerWallet('test_seller_001');
      expect(updated.availableBalanceKes).toBe(initialBalance + 70);
      expect(updated.totalSalesCount).toBe(initial.totalSalesCount + 1);
      expect(updated.grossSalesKes).toBe(initial.grossSalesKes + 100);
    });

    it('respects custom split percentage', () => {
      const initial = paperBankMarketplaceService.getSellerWallet('test_seller_002');
      paperBankMarketplaceService.recordSellerSale('test_seller_002', 200, 60);
      const updated = paperBankMarketplaceService.getSellerWallet('test_seller_002');
      expect(updated.availableBalanceKes).toBe(initial.availableBalanceKes + 120); // 60% of 200
    });
  });

  describe('hasPurchased', () => {
    it('returns false before purchase', () => {
      expect(paperBankMarketplaceService.hasPurchased('mkt_01', 'new_buyer')).toBe(false);
    });
  });

  describe('moderateListing', () => {
    it('approves a pending listing', () => {
      // Inject a pending listing into localStorage
      const pending = {
        id: 'test_listing_01',
        examId: 'exam_001',
        sellerId: 'teacher_test',
        sellerName: 'Test Teacher',
        isSellerVerified: false,
        title: 'Test Paper',
        description: 'Test desc',
        subject: 'Math',
        grade: 'Form 3',
        examType: 'CAT',
        term: 'Term 1',
        year: 2026,
        totalMarks: 50,
        durationMinutes: 60,
        priceKes: 30,
        sellerPercentage: 70,
        platformPercentage: 30,
        rating: 0,
        ratingCount: 0,
        salesCount: 0,
        moderationStatus: 'PENDING' as const,
        copyrightDeclarationAccepted: true,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('soma_marketplace_listings', JSON.stringify([pending]));

      const result = paperBankMarketplaceService.moderateListing('test_listing_01', 'APPROVED', 'admin_001');
      expect(result?.moderationStatus).toBe('APPROVED');
      expect(result?.moderatedBy).toBe('admin_001');
    });

    it('rejects a listing with reason', () => {
      const pending = {
        id: 'test_listing_02', examId: 'e', sellerId: 's', sellerName: 'S', isSellerVerified: false,
        title: 'T', description: 'D', subject: 'English', grade: 'Form 1', examType: 'CAT', term: 'T1', year: 2026,
        totalMarks: 30, durationMinutes: 45, priceKes: 20, sellerPercentage: 70, platformPercentage: 30,
        rating: 0, ratingCount: 0, salesCount: 0, moderationStatus: 'PENDING' as const, copyrightDeclarationAccepted: true,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('soma_marketplace_listings', JSON.stringify([pending]));
      const result = paperBankMarketplaceService.moderateListing('test_listing_02', 'REJECTED', 'admin_001', 'Copyrighted content');
      expect(result?.moderationStatus).toBe('REJECTED');
      expect(result?.moderationReason).toBe('Copyrighted content');
    });
  });

  describe('rateListing', () => {
    it('stores a rating', () => {
      const rating = paperBankMarketplaceService.rateListing('mkt_01', 'buyer_01', 5, 'Excellent!');
      expect(rating.stars).toBe(5);
      expect(rating.note).toBe('Excellent!');
    });

    it('clamps stars between 1 and 5', () => {
      const r1 = paperBankMarketplaceService.rateListing('mkt_01', 'buyer_02', 0);
      const r2 = paperBankMarketplaceService.rateListing('mkt_01', 'buyer_03', 10);
      expect(r1.stars).toBe(1);
      expect(r2.stars).toBe(5);
    });

    it('overwrites existing rating from same buyer', () => {
      paperBankMarketplaceService.rateListing('mkt_02', 'buyer_10', 3);
      const updated = paperBankMarketplaceService.rateListing('mkt_02', 'buyer_10', 5);
      expect(updated.stars).toBe(5);
    });
  });

  describe('getSellerStats', () => {
    it('returns stats with correct structure', () => {
      const stats = paperBankMarketplaceService.getSellerStats('teacher_kamau');
      expect(typeof stats.totalListings).toBe('number');
      expect(typeof stats.avgRating).toBe('number');
      expect(typeof stats.topSubject).toBe('string');
    });
  });

  describe('requestWithdrawal', () => {
    it('throws if amount exceeds balance', async () => {
      const wallet = paperBankMarketplaceService.getSellerWallet('zero_balance_user');
      wallet.availableBalanceKes = 50;
      localStorage.setItem('soma_seller_wallet', JSON.stringify(wallet));
      await expect(paperBankMarketplaceService.requestWithdrawal(500, '0700000000', 'zero_balance_user')).rejects.toThrow();
    });
  });
});
