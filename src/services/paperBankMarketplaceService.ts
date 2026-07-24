import { paperStudioService } from './paperStudioService';

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
  sellerPercentage: number;
  platformPercentage: number;
  rating: number;
  ratingCount: number;
  salesCount: number;
  previewWatermarkUrl?: string;
  moderationStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  moderationReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  copyrightDeclarationAccepted: boolean;
  createdAt: string;
}

export interface MarketplacePurchase {
  id: string;
  listingId: string;
  buyerId: string;
  buyerPhone: string;
  amountKes: number;
  sellerEarnedKes: number;
  platformEarnedKes: number;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  purchasedAt: string;
}

export interface MarketplaceRating {
  id: string;
  listingId: string;
  buyerId: string;
  stars: number;
  note?: string;
  createdAt: string;
}

export interface SellerWalletSummary {
  sellerId: string;
  totalPublishedPapers: number;
  totalSalesCount: number;
  grossSalesKes: number;
  availableBalanceKes: number;
  pendingBalanceKes: number;
  withdrawalPhone: string;
  lastWithdrawalAt?: string;
}

export interface SellerStats {
  sellerId: string;
  totalListings: number;
  approvedListings: number;
  pendingListings: number;
  totalSales: number;
  totalEarningsKes: number;
  avgRating: number;
  topSubject: string;
}

export interface MpesaPurchaseResult {
  success: boolean;
  orderId: string;
  reference: string;
  alreadyPaid?: boolean;
  redirectUrl?: string;
}

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  amountKes: number;
  phone: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  requestedAt: string;
  processedAt?: string;
}

const MARKETPLACE_LISTINGS_KEY = 'soma_marketplace_listings';
const SELLER_WALLET_KEY = 'soma_seller_wallet';
const MARKETPLACE_PURCHASES_KEY = 'soma_marketplace_purchases';
const MARKETPLACE_RATINGS_KEY = 'soma_marketplace_ratings';
const WITHDRAWAL_REQUESTS_KEY = 'soma_withdrawal_requests';

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
    ratingCount: 34,
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
    ratingCount: 21,
    salesCount: 98,
    moderationStatus: 'APPROVED',
    copyrightDeclarationAccepted: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mkt_03',
    examId: 'paper_kcse_eng_2026',
    sellerId: 'teacher_odhiambo',
    sellerName: 'Teacher Odhiambo (English HOD)',
    isSellerVerified: true,
    title: 'KCSE English Paper 2 — Comprehension & Summary Practice',
    description: 'Authentic KCSE English Paper 2 practice covering prose, poetry, and functional writing with detailed marking rubric.',
    subject: 'English',
    grade: 'Form 4',
    examType: 'MOCK',
    term: 'Term 2',
    year: 2026,
    totalMarks: 80,
    durationMinutes: 150,
    priceKes: 45,
    sellerPercentage: 70,
    platformPercentage: 30,
    rating: 4.7,
    ratingCount: 15,
    salesCount: 67,
    moderationStatus: 'APPROVED',
    copyrightDeclarationAccepted: true,
    createdAt: new Date().toISOString(),
  },
];

const readLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const paperBankMarketplaceService = {
  async getMarketplaceListings(subjectFilter?: string, gradeFilter?: string): Promise<MarketplaceListing[]> {
    const customListings = readLocal<MarketplaceListing[]>(MARKETPLACE_LISTINGS_KEY, []);
    const all = [...customListings, ...SEED_MARKETPLACE_LISTINGS];
    return all.filter((item) => {
      if (item.moderationStatus !== 'APPROVED') return false;
      if (subjectFilter && subjectFilter !== 'ALL' && item.subject.toLowerCase() !== subjectFilter.toLowerCase()) return false;
      if (gradeFilter && gradeFilter !== 'ALL' && item.grade.toLowerCase() !== gradeFilter.toLowerCase()) return false;
      return true;
    });
  },

  async getFeaturedListings(limit = 6): Promise<MarketplaceListing[]> {
    const all = await this.getMarketplaceListings();
    return [...all].sort((a, b) => b.salesCount - a.salesCount || b.rating - a.rating).slice(0, limit);
  },

  getPendingModerationListings(): MarketplaceListing[] {
    return readLocal<MarketplaceListing[]>(MARKETPLACE_LISTINGS_KEY, []).filter((l) => l.moderationStatus === 'PENDING');
  },

  moderateListing(listingId: string, decision: 'APPROVED' | 'REJECTED', moderatorId: string, reason?: string): MarketplaceListing | null {
    const listings = readLocal<MarketplaceListing[]>(MARKETPLACE_LISTINGS_KEY, []);
    const idx = listings.findIndex((l) => l.id === listingId);
    if (idx === -1) return null;
    listings[idx] = { ...listings[idx], moderationStatus: decision, moderationReason: reason, moderatedBy: moderatorId, moderatedAt: new Date().toISOString() };
    writeLocal(MARKETPLACE_LISTINGS_KEY, listings);
    return listings[idx];
  },

  async submitPaperToMarketplace(paperId: string, priceKes: number, description: string, copyrightDeclaration: boolean, sellerPercentage = 70): Promise<MarketplaceListing> {
    if (!copyrightDeclaration) throw new Error('You must accept the copyright declaration before submitting to marketplace.');
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
      sellerPercentage,
      platformPercentage: 100 - sellerPercentage,
      rating: 0,
      ratingCount: 0,
      salesCount: 0,
      moderationStatus: 'PENDING',
      copyrightDeclarationAccepted: true,
      createdAt: new Date().toISOString(),
    };

    const customListings = readLocal<MarketplaceListing[]>(MARKETPLACE_LISTINGS_KEY, []);
    customListings.unshift(listing);
    writeLocal(MARKETPLACE_LISTINGS_KEY, customListings);

    paper.visibility = 'MARKETPLACE';
    paper.priceKes = listing.priceKes;
    paper.isMarketplaceApproved = false;
    await paperStudioService.savePaper(paper);
    return listing;
  },

  withdrawFromMarketplace(listingId: string): boolean {
    const listings = readLocal<MarketplaceListing[]>(MARKETPLACE_LISTINGS_KEY, []);
    const idx = listings.findIndex((l) => l.id === listingId);
    if (idx === -1) return false;
    listings.splice(idx, 1);
    writeLocal(MARKETPLACE_LISTINGS_KEY, listings);
    return true;
  },

  async purchasePaper(listingId: string, buyerPhone: string, buyerId = 'buyer_user'): Promise<MpesaPurchaseResult> {
    const listings = await this.getMarketplaceListings();
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) throw new Error('Listing not found.');

    const sellerEarned = Math.round(listing.priceKes * (listing.sellerPercentage / 100));
    const reference = `SOMA_PB_${Date.now()}`;
    const purchase: MarketplacePurchase = {
      id: `purchase_${Date.now()}`, listingId, buyerId, buyerPhone, amountKes: listing.priceKes,
      sellerEarnedKes: sellerEarned, platformEarnedKes: listing.priceKes - sellerEarned,
      reference, status: 'SUCCESS', purchasedAt: new Date().toISOString(),
    };
    const purchases = readLocal<MarketplacePurchase[]>(MARKETPLACE_PURCHASES_KEY, []);
    purchases.unshift(purchase);
    writeLocal(MARKETPLACE_PURCHASES_KEY, purchases);
    this.recordSellerSale(listing.sellerId, listing.priceKes, listing.sellerPercentage);
    return { success: true, orderId: `order_${Date.now()}`, reference };
  },

  hasPurchased(listingId: string, buyerId = 'buyer_user'): boolean {
    return readLocal<MarketplacePurchase[]>(MARKETPLACE_PURCHASES_KEY, [])
      .some((p) => p.listingId === listingId && p.buyerId === buyerId && p.status === 'SUCCESS');
  },

  getUserPurchases(buyerId = 'teacher_user'): MarketplacePurchase[] {
    const list = readLocal<MarketplacePurchase[]>(MARKETPLACE_PURCHASES_KEY, []);
    return list.filter((p) => p.buyerId === buyerId || p.buyerId === 'buyer_user');
  },


  rateListing(listingId: string, buyerId: string, stars: number, note?: string): MarketplaceRating {
    const ratings = readLocal<MarketplaceRating[]>(MARKETPLACE_RATINGS_KEY, []);
    const existing = ratings.findIndex((r) => r.listingId === listingId && r.buyerId === buyerId);
    const rating: MarketplaceRating = { id: `rating_${Date.now()}`, listingId, buyerId, stars: Math.max(1, Math.min(5, stars)), note, createdAt: new Date().toISOString() };
    if (existing >= 0) ratings[existing] = rating; else ratings.unshift(rating);
    writeLocal(MARKETPLACE_RATINGS_KEY, ratings);
    this._recomputeListingRating(listingId, ratings);
    return rating;
  },

  _recomputeListingRating(listingId: string, allRatings: MarketplaceRating[]): void {
    const relevant = allRatings.filter((r) => r.listingId === listingId);
    if (!relevant.length) return;
    const avg = relevant.reduce((s, r) => s + r.stars, 0) / relevant.length;
    const listings = readLocal<MarketplaceListing[]>(MARKETPLACE_LISTINGS_KEY, []);
    const idx = listings.findIndex((l) => l.id === listingId);
    if (idx === -1) return;
    listings[idx].rating = Math.round(avg * 10) / 10;
    listings[idx].ratingCount = relevant.length;
    writeLocal(MARKETPLACE_LISTINGS_KEY, listings);
  },

  recordSellerSale(sellerId: string, priceKes: number, sellerPercent = 70): void {
    const sellerEarned = Math.round(priceKes * (sellerPercent / 100));
    const summary = this.getSellerWallet(sellerId);
    summary.totalSalesCount += 1;
    summary.grossSalesKes += priceKes;
    summary.availableBalanceKes += sellerEarned;
    writeLocal(SELLER_WALLET_KEY, summary);
  },

  getSellerWallet(sellerId = 'teacher_user'): SellerWalletSummary {
    return readLocal<SellerWalletSummary | null>(SELLER_WALLET_KEY, null) ?? {
      sellerId, totalPublishedPapers: 3, totalSalesCount: 18, grossSalesKes: 900,
      availableBalanceKes: 630, pendingBalanceKes: 0, withdrawalPhone: '0722000000',
    };
  },

  getSellerStats(sellerId: string): SellerStats {
    const all = [...readLocal<MarketplaceListing[]>(MARKETPLACE_LISTINGS_KEY, []), ...SEED_MARKETPLACE_LISTINGS];
    const sellerListings = all.filter((l) => l.sellerId === sellerId);
    const approved = sellerListings.filter((l) => l.moderationStatus === 'APPROVED');
    const pending = sellerListings.filter((l) => l.moderationStatus === 'PENDING');
    const totalSales = approved.reduce((s, l) => s + l.salesCount, 0);
    const grossKes = approved.reduce((s, l) => s + l.salesCount * l.priceKes * (l.sellerPercentage / 100), 0);
    const avgRating = approved.length ? approved.reduce((s, l) => s + l.rating, 0) / approved.length : 0;
    const subjectCounts: Record<string, number> = {};
    sellerListings.forEach((l) => { subjectCounts[l.subject] = (subjectCounts[l.subject] || 0) + 1; });
    const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    return { sellerId, totalListings: sellerListings.length, approvedListings: approved.length, pendingListings: pending.length, totalSales, totalEarningsKes: Math.round(grossKes), avgRating: Math.round(avgRating * 10) / 10, topSubject };
  },

  async requestWithdrawal(amountKes: number, phone: string, sellerId = 'teacher_user'): Promise<WithdrawalRequest> {
    const wallet = this.getSellerWallet(sellerId);
    if (amountKes > wallet.availableBalanceKes) throw new Error('Requested amount exceeds available balance.');
    wallet.availableBalanceKes -= amountKes;
    wallet.lastWithdrawalAt = new Date().toISOString();
    writeLocal(SELLER_WALLET_KEY, wallet);
    const request: WithdrawalRequest = { id: `wd_${Date.now()}`, sellerId, amountKes, phone, status: 'PENDING', requestedAt: new Date().toISOString() };
    const requests = readLocal<WithdrawalRequest[]>(WITHDRAWAL_REQUESTS_KEY, []);
    requests.unshift(request);
    writeLocal(WITHDRAWAL_REQUESTS_KEY, requests);
    return request;
  },

  getWithdrawalHistory(sellerId = 'teacher_user'): WithdrawalRequest[] {
    return readLocal<WithdrawalRequest[]>(WITHDRAWAL_REQUESTS_KEY, []).filter((r) => r.sellerId === sellerId);
  },

  /** Submit or update seller onboarding application */
  submitSellerApplication(app: {
    userId: string;
    fullName: string;
    accountType: 'teacher' | 'school';
    phone: string;
    email: string;
    county: string;
    school: string;
    subjects: string[];
    grades: string[];
    teachingExperienceYears: number;
    mpesaPayoutNumber: string;
    copyrightDeclarationAccepted: boolean;
  }): { id: string; status: string; submittedAt: string } {
    const record = {
      id: `app_${Date.now()}`,
      ...app,
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
    };
    writeLocal(`soma_seller_app_${app.userId}`, record);
    return record;
  },

  getSellerApplication(userId = 'teacher_user'): { status: string; fullName?: string; accountType?: string } | null {
    return readLocal(`soma_seller_app_${userId}`, null) ?? { status: 'approved', fullName: 'Mwalimu Kamau', accountType: 'teacher' };
  },

  /** Creates a private editable paper copy for a buyer in Paper Studio while preserving attribution */
  async createEditableCopyFromPurchase(purchaseId: string, buyerUserId: string): Promise<{ paperId: string; title: string }> {
    const purchases = readLocal<MarketplacePurchase[]>(MARKETPLACE_PURCHASES_KEY, []);
    const purchase = purchases.find((p) => p.id === purchaseId || p.buyerId === buyerUserId);
    const listingId = purchase?.listingId || 'mkt_01';
    const all = [...readLocal<MarketplaceListing[]>(MARKETPLACE_LISTINGS_KEY, []), ...SEED_MARKETPLACE_LISTINGS];
    const listing = all.find((l) => l.id === listingId) || SEED_MARKETPLACE_LISTINGS[0];

    const copyTitle = `[Purchased Copy] ${listing.title}`;
    const newPaperId = `paper_purchased_${Date.now()}`;
    const newPaper = {
      id: newPaperId,
      ownerId: buyerUserId,
      title: copyTitle,
      status: 'DRAFT' as const,
      visibility: 'PRIVATE' as const,
      grade: listing.grade,
      subject: listing.subject,
      examType: (listing.examType as any) || 'CAT',
      term: listing.term || 'Term 1',
      year: listing.year || 2026,
      durationMinutes: listing.durationMinutes || 60,
      totalMarks: listing.totalMarks || 100,
      schoolBranding: { schoolName: 'My School', candidateNameField: true, admissionNoField: true },
      instructions: ['Purchased from Soma Paper Bank. Private teaching use only.'],
      sections: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await paperStudioService.savePaper(newPaper);
    return { paperId: newPaper.id, title: newPaper.title };
  },


  /** File a copyright infringement or quality report */
  fileCopyrightReport(listingId: string, reporterUserId: string, reason: string, details: string): { id: string; status: string } {
    const report = {
      id: `rep_${Date.now()}`,
      listingId,
      reporterUserId,
      reason,
      details,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    const reports = readLocal<any[]>('soma_marketplace_reports', []);
    reports.unshift(report);
    writeLocal('soma_marketplace_reports', reports);
    return report;
  },
};

