import React from 'react';
import { PurchaseReport } from './PurchaseReport';

export function CustomerCareView() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Customer care</h1>
        <p className="mt-2 text-slate-700">Help customers get value from their purchase, not just a receipt.</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Choose a purchase type and period, then find the buyer below.</li>
          <li>Select Message buyer to prepare a thank-you, purchase-support message or optional update.</li>
          <li>Review the draft and contact permission before opening your email or WhatsApp app.</li>
        </ol>
        <p className="mt-4 font-semibold text-indigo-900">Drafts only — nothing is sent automatically.</p>
        <p className="mt-2 text-sm text-slate-600">These are purchase records, not a marketing subscriber list. Optional updates require permission for the channel you use. Drafts are not saved when you leave this page. Bulk campaigns and automatic thank-you delivery are not enabled.</p>
      </section>
      <PurchaseReport customerCare />
    </div>
  );
}
