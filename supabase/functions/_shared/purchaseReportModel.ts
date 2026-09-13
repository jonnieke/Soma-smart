export type Purchase = {
  id: string;
  reference: string;
  customerId: string;
  name: string;
  studentId: string;
  phone: string;
  email: string;
  contactSource: string;
  category: string;
  product: string;
  amount: number;
  status: string;
  createdAt: string;
  planStatus: string;
  planExpiry: string;
};
type Row = Record<string, any>;
export function buildPurchaseReport(
  transactions: Row[],
  orders: Row[],
  profiles: Row[],
  papers: Row[],
  contacts: Row[] = []
): Purchase[] {
  const people = new Map(profiles.map((p) => [String(p.id), p]));
  const titles = new Map(papers.map((p) => [String(p.id), p.title]));
  const receipts = new Map(contacts.map((c) => [c.reference_code, c]));
  const rows: Purchase[] = transactions.map((t) => {
    const p = people.get(String(t.user_id));
    const receipt = receipts.get(t.reference_code);
    const description = String(t.description || '');
    const plan =
      description.match(/(?:^|\|)CATALOG:([^|]+)/)?.[1] ||
      description.match(/(?:^|\|)PLAN:([^|]+)/)?.[1];
    const category =
      t.type === 'SUBSCRIPTION'
        ? 'Learning subscription'
        : t.type === 'CREDIT_PACK'
          ? 'Learning credits'
          : t.type === 'MARKETPLACE_PURCHASE'
            ? 'Marketplace material'
            : 'Other';
    return {
      id: `transaction:${t.id}`,
      reference: t.reference_code || String(t.id),
      customerId: p?.id || t.user_id || '',
      name: p?.full_name || 'Account not linked',
      studentId: p?.student_id || '',
      phone: receipt ? receipt.payer_phone || '' : p?.phone || '',
      email: receipt ? receipt.payer_email || '' : p?.email || '',
      contactSource: receipt ? 'Checkout contact (payer)' : 'Profile contact',
      category,
      product: plan ? plan.replace(/_/g, ' ') : category,
      amount: Number(t.amount) || 0,
      status: String(t.status || 'UNKNOWN').toUpperCase(),
      createdAt: t.created_at,
      planStatus: p?.subscription_tier || p?.subscription_status || '',
      planExpiry: p?.subscription_expiry || '',
    };
  });
  for (const o of orders)
    rows.push({
      id: `paper:${o.id}`,
      reference: o.reference_code || String(o.id),
      customerId: '',
      name: o.buyer_name || 'Guest buyer',
      studentId: '',
      phone: o.buyer_phone || '',
      email: o.buyer_email || '',
      contactSource: 'Checkout contact (payer)',
      category: 'Past paper',
      product: titles.get(String(o.exam_id)) || `Paper ${o.exam_id}`,
      amount: Number(o.amount) || 0,
      status: String(o.status || 'UNKNOWN').toUpperCase(),
      createdAt: o.created_at,
      planStatus: '',
      planExpiry: '',
    });
  return rows.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
export function purchaseTotals(rows: Purchase[]) {
  const paid = rows.filter((r) => r.status === 'SUCCESS');
  const total = (category?: string) =>
    paid.filter((r) => !category || r.category === category).reduce((sum, r) => sum + r.amount, 0);
  return {
    revenue: total(),
    subscriptions: total('Learning subscription'),
    papers: total('Past paper'),
    subscriptionOrders: paid.filter((r) => r.category === 'Learning subscription').length,
    paperOrders: paid.filter((r) => r.category === 'Past paper').length,
    pending: rows.filter((r) => r.status === 'PENDING').length,
  };
}
export function purchaseCsv(rows: Purchase[]) {
  const cells = [
    [
      'Buyer',
      'Student ID',
      'Phone',
      'Email',
      'Purchase type',
      'Product',
      'KES',
      'Status',
      'Date',
      'Reference',
    ],
    ...rows.map((r) => [
      r.name,
      r.studentId,
      r.phone,
      r.email,
      r.category,
      r.product,
      String(r.amount),
      r.status,
      r.createdAt,
      r.reference,
    ]),
  ];
  return cells
    .map((row) =>
      row
        .map((value) => {
          const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\r\n');
}
