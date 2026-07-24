import { describe, it, expect } from 'vitest';
import { schoolWorkspaceService } from '../services/schoolWorkspaceService';
import { paperBankMarketplaceService } from '../services/paperBankMarketplaceService';

describe('School Workspace & Paper Bank Marketplace Services', () => {
  it('loads school departments and branding', async () => {
    const depts = await schoolWorkspaceService.getDepartments();
    expect(depts.length).toBeGreaterThan(0);
    expect(depts[0].name).toContain('Mathematics');

    const branding = schoolWorkspaceService.getSchoolBranding();
    expect(branding.schoolName).toBeTruthy();
  });

  it('retrieves active marketplace listings', async () => {
    const listings = await paperBankMarketplaceService.getMarketplaceListings();
    expect(listings.length).toBeGreaterThan(0);
    expect(listings[0].priceKes).toBeGreaterThan(0);
  });

  it('calculates 70/30 seller revenue split correctly upon purchase', async () => {
    const initialWallet = paperBankMarketplaceService.getSellerWallet('teacher_user');
    const priceKes = 100;
    paperBankMarketplaceService.recordSellerSale('teacher_user', priceKes);

    const updatedWallet = paperBankMarketplaceService.getSellerWallet('teacher_user');
    expect(updatedWallet.grossSalesKes).toBe(initialWallet.grossSalesKes + 100);
    expect(updatedWallet.availableBalanceKes).toBe(initialWallet.availableBalanceKes + 70); // 70% share
  });
});
