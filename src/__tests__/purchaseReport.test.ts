import { describe, it, expect } from 'vitest';
import {
  buildPurchaseReport,
  purchaseTotals,
  purchaseCsv,
} from '../../supabase/functions/_shared/purchaseReportModel';
const tx = {
  id: 't1',
  user_id: 'u1',
  reference_code: 'SUB_abc',
  type: 'SUBSCRIPTION',
  description: 'PLAN:DAILY|CATALOG:daily_dash',
  amount: 20,
  status: 'SUCCESS',
  created_at: '2026-09-13T12:00:00Z',
};
const order = {
  id: 'o1',
  exam_id: 12,
  reference_code: 'PAPER_12_abc',
  buyer_name: 'Paper Buyer',
  buyer_phone: '0712345678',
  amount: 20,
  status: 'SUCCESS',
  created_at: '2026-09-13T13:00:00Z',
};
describe('purchase reporting', () => {
  it('joins the actual buyer and product, keeping references separate', () => {
    const rows = buildPurchaseReport(
      [tx],
      [order],
      [{ id: 'u1', full_name: 'Test Learner', student_id: 'SOMA-TEST', phone: '0700000000' }],
      [{ id: 12, title: 'Biology Paper 1' }]
    );
    expect(rows[0]).toMatchObject({
      name: 'Paper Buyer',
      product: 'Biology Paper 1',
      category: 'Past paper',
    });
    expect(rows[1]).toMatchObject({
      name: 'Test Learner',
      studentId: 'SOMA-TEST',
      product: 'daily dash',
      reference: 'SUB_abc',
    });
    expect(purchaseTotals(rows)).toMatchObject({
      revenue: 40,
      subscriptions: 20,
      papers: 20,
      subscriptionOrders: 1,
      paperOrders: 1,
    });
  });
  it('does not count pending, failed or refunded orders as paid', () => {
    const rows = buildPurchaseReport(
      ['SUCCESS', 'FAILED', 'PENDING', 'REFUNDED'].map((status, i) => ({ ...tx, id: i, status })),
      [{ ...order, status: 'REFUNDED' }],
      [],
      []
    );
    expect(purchaseTotals(rows)).toMatchObject({
      revenue: 20,
      papers: 0,
      pending: 1,
      subscriptionOrders: 1,
    });
  });
  it('does not invent an identity from a payment reference or merge guests into learner accounts', () => {
    const rows = buildPurchaseReport([tx], [order], [], []);
    expect(rows.find((r) => r.reference === 'SUB_abc')?.name).toBe('Account not linked');
    expect(rows.find((r) => r.category === 'Past paper')?.customerId).toBe('');
  });
  it('keeps credits and marketplace revenue out of subscription totals', () => {
    const rows = buildPurchaseReport(
      ['CREDIT_PACK', 'MARKETPLACE_PURCHASE'].map((type) => ({ ...tx, type })),
      [],
      [],
      []
    );
    expect(purchaseTotals(rows)).toMatchObject({ revenue: 40, subscriptions: 0 });
  });
  it('escapes CSV quotes and prevents spreadsheet formula execution', () => {
    const rows = buildPurchaseReport([], [{ ...order, buyer_name: '=HYPERLINK("bad")' }], [], []);
    expect(purchaseCsv(rows)).toContain('"\'=HYPERLINK(""bad"")"');
  });
});
