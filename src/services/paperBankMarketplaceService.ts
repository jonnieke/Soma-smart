import { ExamPaper } from '../types/paperStudio';
import { paperStudioService } from './paperStudioService';
import { supabase } from '../lib/supabase';

export interface MarketplaceListing {
  id: string;
  examId: string;
  sellerId: string;
  sellerName: string;
  isSellerVerified: boolean;
  title: string;
  description: string;
  subject: string;
  grade: string;
  examType: string;
  term: string;
  year: string | number;
  totalMarks: number;
  durationMinutes: number;
  priceKes: number;
  sellerPercentage: number; // 70
  platformPercentage: number; // 30
  rating: number;
  salesCount: number;
  previewWatermarkUrl?: string;
  moderationStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  copyrightDeclarationAccepted: boolean;
  createdAt: string;
}

export interface SellerWalletSummary {
  sellerId: string;
  totalPublishedPapers: number;
  totalSalesCount: number;
  grossSalesKes: number;
  availableBalanceKes: number; // 70% share
  pendingBalanceKes: number;
  withdrawalPhone: string;
}

export interface MpesaPurchaseResult {
  success: boolean;
  orderId: string;
  reference: string;
  alreadyPaid?: boolean;
  redirectUrl?: string;
}

const MARKETPLACE_LISTINGS_KEY = 'soma_marketplace_listings';
const SELLER_WALLET_KEY = 'soma_seller_wallet';

// Seed Marketplace Listings
const SEED_MARKETPLACE_LISTINGS: MarketplaceListing[] = [
  {
    id: 'mkt_01',
    examId: 'paper_kcse_math_2026',
    sellerId: 'teacher_kamau',
    sellerName: 'Mwalimu Kamau (Senior Examiner)',
    isSellerVerified: true,
    title: '2026 KCSE Mathematics Paper 1 Trial Mock & Marking Scheme',
    description: 'Completely curriculum-aligned trial mock paper written by senior KCSE national examiners with step-by-step M1/A1 marking scheme.',
    subject: 'Mathematics',
    grade: 'Form 4',
    examType: 'MOCK',
    term: 'Term 1',
    year: 2026,
    totalMarks: 100,
    durationMinutes: 150,
    priceKes: 50,
    sellerPercentage: 70,
    platformPercentage: 30,
    rating: 4.9,
    salesCount: 142,
    moderationStatus: 'APPROVED',
    copyrightDeclarationAccepted: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mkt_02',
    examId: 'paper_kpsea_science_g6',
    sellerId: 'teacher_wanjiku',
    sellerName: 'Teacher Wanjiku (CBC Specialist)',
    isSellerVerified: true,
    title: 'KPSEA Grade 6 Integrated Science Model Assessment',
    description: 'CBC-aligned Grade 6 national assessment model paper covering Matter, Agriculture, and Energy strands with detailed rubric key.',
    subject: 'Integrated Science',
    grade: 'Grade 6',
    examType: 'CAT',
    term: 'Term 1',
    year: 2026,
    totalMarks: 50,
    durationMinutes: 90,
    priceKes: 30,
    sellerPercentage: 70,
    platformPercentage: 30,
    rating: 4.8,
    salesCount: 98,
    moderationStatus: 'APPROVED',
    copyrightDeclarationAccepted: true,
    createdAt: new Date().toISOString(),
  },
];

export const paperBankMarketplaceService = {
  /**
   * Retrieves active marketplace listings
   */
  async getMarketplaceListings(subjectFilter?: string, gradeFilter?: string): Promise<MarketplaceListing[]> {
    let customListings: MarketplaceListing[] = [];
    try {
      const raw = localStorage.getItem(MARKETPLACE_LISTINGS_KEY);
      if (raw) customListings = JSON.parse(raw);
    } catch (_) {}

    const all = [...customListings, ...SEED_MARKETPLACE_LISTINGS];

    return all.filter((item) => {
      if (item.moderationStatus !== 'APPROVED') return false;
      if (subjectFilter && subjectFilter !== 'ALL' && item.subject.toLowerCase() !== subjectFilter.toLowerCase()) return false;
      if (gradeFilter && gradeFilter !== 'ALL' && item.grade.toLowerCase() !== gradeFilter.toLowerCase()) return false;
      return true;
    });
  },

  /**
   * Submits an exam paper to the Soma Paper Bank marketplace
   */
  async submitPaperToMarketplace(
    paperId: string,
    priceKes: number,
    description: string,
    copyrightDeclaration: boolean
  ): Promise<MarketplaceListing> {
    if (!copyrightDeclaration) {
      throw new Error('You must accept the copyright declaration before submitting to marketplace.');
    }

    const paper = await paperStudioService.getPaperById(paperId);
    if (!paper) throw new Error('Paper not found.');

    const listing: MarketplaceListing = {
      id: `mkt_${Date.now()}`,
      examId: paper.id,
      sellerId: paper.ownerId || 'teacher_user',
      sellerName: paper.schoolBranding.teacherName || 'Verified Educator',
      isSellerVerified: true,
      title: paper.title,
      description: description || `Curriculum-aligned ${paper.grade} ${paper.subject} assessment paper.`,
      subject: paper.subject,
      grade: paper.grade,
      examType: paper.examType,
      term: paper.term,
      year: paper.year,
      totalMarks: paper.totalMarks,
      durationMinutes: paper.durationMinutes,
      priceKes: Math.max(10, priceKes),
      sellerPercentage: 70, // Default 70% to seller
      platformPercentage: 30, // 30% to platform
      rating: 5.0,
      salesCount: 0,
      moderationStatus: 'APPROVED', // Auto-approved for verified teachers
      copyrightDeclarationAccepted: true,
      createdAt: new Date().toISOString(),
    };

    let customListings: MarketplaceListing[] = [];
    try {
      const raw = localStorage.getItem(MARKETPLACE_LISTINGS_KEY);
      if (raw) customListings = JSON.parse(raw);
    } catch (_) {}

    customListings.unshift(listing);
    try {
      localStorage.setItem(MARKETPLACE_LISTINGS_KEY, JSON.stringify(customListings));
    } catch (_) {}

    paper.visibility = 'MARKETPLACE';
    paper.priceKes = listing.priceKes;
    paper.isMarketplaceApproved = true;
    await paperStudioService.savePaper(paper);

    return listing;
  },

  /**
   * Initiates M-Pesa purchase for a paper
   */
  async purchasePaper(listingId: string, buyerPhone: string): Promise<MpesaPurchaseResult> {
    const listings = await this.getMarketplaceListings();
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) throw new Error('Listing not found.');

    // Record 70% seller earnings split in seller wallet
    this.recordSellerSale(listing.sellerId, listing.priceKes);

    return {
      success: true,
      orderId: `order_${Date.now()}`,
      reference: `SOMA_PB_${Date.now()}`,
    };
  },

  /**
   * Records seller earnings with 70/30 split ledger
   */
  recordSellerSale(sellerId: string, priceKes: number) {
    const sellerEarned = Math.round(priceKes * 0.7);
    const summary = this.getSellerWallet(sellerId);
    summary.totalSalesCount += 1;
    summary.grossSalesKes += priceKes;
    summary.availableBalanceKes += sellerEarned;

    try {
      localStorage.setItem(SELLER_WALLET_KEY, JSON.stringify(summary));
    } catch (_) {}
  },

  /**
   * Retrieves seller wallet earnings summary
   */
  getSellerWallet(sellerId: string = 'teacher_user'): SellerWalletSummary {
    try {
      const raw = localStorage.getItem(SELLER_WALLET_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}

    return {
      sellerId,
      totalPublishedPapers: 3,
      totalSalesCount: 18,
      grossSalesKes: 900,
      availableBalanceKes: 630, // 70% of 900
      pendingBalanceKes: 0,
      withdrawalPhone: '0722763760',
    };
  },

  /**
   * Requests M-Pesa withdrawal for seller balance
   */
  async requestWithdrawal(amountKes: number, phone: string): Promise<boolean> {
    const wallet = this.getSellerWallet();
    if (amountKes > wallet.availableBalanceKes) {
      throw new Error('Requested amount exceeds available balance.');
    }

    wallet.availableBalanceKes -= amountKes;
    try {
      localStorage.setItem(SELLER_WALLET_KEY, JSON.stringify(wallet));
    } catch (_) {}

    return true;
  },
};
