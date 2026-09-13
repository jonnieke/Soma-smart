import { supabase } from '../lib/supabase';
export interface PaymentRecord {
  id?: string; user_id?: string; reference_code: string; amount: number; status: string;
  description: string; created_at: string; order_tracking_id?: string; type: string;
}

/** A receipt is scoped to one unguessable order reference and, for recovery, its recipient. */
export async function getPaymentReceipt(reference: string | null | undefined, profileId?: string): Promise<PaymentRecord | null> {
  if (!reference) return null;
  const { data, error } = await supabase.functions.invoke('pesapal/receipt-status', {
    body: { merchantReference: reference, profileId },
  });
  if (error || data?.error) throw new Error('Payment confirmation unavailable. Please retry.');
  return data?.receipt || null;
}

export async function getOwnPaymentHistory(profileId: string): Promise<PaymentRecord[]> {
  const { data: session } = await supabase.auth.getSession();
  if (session.session?.user.id === profileId) {
    const { data, error } = await supabase.from('transactions')
      .select('reference_code,user_id,amount,status,description,created_at,order_tracking_id,type')
      .eq('user_id', profileId).order('created_at', { ascending: false }).limit(120);
    if (error) throw error;
    return data || [];
  }
  // Student-ID logins are not Supabase Auth identities. They cannot enumerate history.
  const reference = localStorage.getItem('soma_last_payment_reference') || '';
  const receipt = await getPaymentReceipt(reference, profileId);
  return receipt ? [receipt] : [];
}

export async function getAdminPaymentRows(days = 0) {
  const { data, error } = await supabase.functions.invoke('admin-purchases', { body: { days } });
  if (error || data?.error || !Array.isArray(data?.purchases)) throw new Error('Admin purchase report unavailable');
  return data.purchases.map((p: any) => ({
    id: p.id, user: p.name, user_id: p.customerId, reference_code: p.reference,
    amount: p.amount, status: p.status, created_at: p.createdAt,
    type: p.category === 'Learning subscription' ? 'SUBSCRIPTION' : p.category === 'Past paper' ? 'PAST_PAPER' : p.category,
  }));
}
