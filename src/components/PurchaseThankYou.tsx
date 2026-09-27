import type { PaymentRecord } from '../services/transactionAccessService';

export function purchaseNextStep(receipt: Pick<PaymentRecord, 'type'>, role?: string) {
  if (receipt.type === 'CREDIT_PACK') return { label: 'Continue with your credits', path: role === 'TEACHER' ? '/teacher' : '/learner', text: 'Thank you for buying learning credits. This purchase is separate from a subscription.' };
  if (receipt.type === 'MARKETPLACE_PURCHASE') return { label: 'Open purchased materials', path: '/marketplace/purchased', text: 'Thank you for buying a teaching material. Your purchase is not a learning subscription.' };
  if (receipt.type === 'PAST_PAPER') return { label: 'Find your paper', path: '/exam-papers', text: 'Thank you for buying an exam paper. Open the paper bank to access your purchase.' };
  if (receipt.type === 'SUBSCRIPTION') return { label: role === 'TEACHER' ? 'Go to your teaching workspace' : 'Continue learning', path: role === 'TEACHER' ? '/teacher' : role === 'SCHOOL' ? '/school' : '/learner', text: 'Thank you for subscribing to Soma. Your verified purchase is ready to use.' };
  return { label: 'Continue to Soma', path: '/', text: 'Thank you for your purchase. Contact support if you need help finding what you bought.' };
}

export function PurchaseThankYou({ receipt, role, onContinue, ready = true, title, continueLabel, guest = false }: {
  receipt: Pick<PaymentRecord, 'status' | 'type'> & Partial<Pick<PaymentRecord, 'amount'>>;
  role?: string; onContinue: () => void; ready?: boolean; title?: string; continueLabel?: string; guest?: boolean;
}) {
  if (receipt.status !== 'SUCCESS') return null;
  const next = purchaseNextStep(receipt, role);
  return <section aria-label="Purchase confirmed" className="space-y-4 text-slate-900">
    <h2 className="text-2xl font-bold">Thank you for choosing Soma!</h2>
    <p>{next.text}</p>
    {title && <p className="font-semibold">{title}</p>}
    <p className="font-semibold">Payment confirmed{typeof receipt.amount === 'number' && Number.isFinite(receipt.amount) ? ` · KES ${receipt.amount.toLocaleString()}` : ''}</p>
    <button type="button" disabled={!ready} onClick={onContinue} className="w-full rounded-xl bg-indigo-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{ready ? continueLabel || next.label : 'Preparing your account…'}</button>
    {guest ? <p className="text-sm">Your paper is remembered in this browser. Keep your payment receipt for support if you change devices. You have not been signed up for updates.</p> : <p className="text-sm">You choose whether to receive updates. <a href="/communication-preferences" target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline">Manage preferences (new tab)</a></p>}
    <a href="https://wa.me/254722763760" target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-indigo-700 underline">Need help? Contact Soma support</a>
  </section>;
}
