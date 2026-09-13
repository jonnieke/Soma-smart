import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  Purchase,
  purchaseTotals,
  purchaseCsv,
} from '../../../../supabase/functions/_shared/purchaseReportModel';
const field = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
const action =
  'rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40';
const money = (n: number) => `KES ${n.toLocaleString()}`;

function ContactDraft({ purchase: p, onClose }: { purchase: Purchase; onClose: () => void }) {
  const [kind, setKind] = useState('thanks');
  const thanks = `Hello ${p.name}, thank you for purchasing ${p.product} on Soma AI. We received ${money(p.amount)}. Continue at https://www.somaai.co.ke/${p.category === 'Past paper' ? 'exam-papers using the browser you purchased with' : 'learner'}. Please let us know if you need help getting started.`;
  const [message, setMessage] = useState(thanks);
  const [copied, setCopied] = useState('');
  const [consent, setConsent] = useState(false);
  const changeKind = (value: string) => {
    setKind(value);
    setCopied('');
    setMessage(
      value === 'thanks'
        ? thanks
        : value === 'update'
          ? `Hello ${p.name}, an update about your Soma AI purchase (${p.product}):\n\n[Add the update and what the customer needs to do.]`
          : `Hello ${p.name}, thank you for learning with Soma AI.\n\n[Describe your approved offer, eligibility, expiry date and redemption link.]\n\nReply STOP if you do not want further offers.`
    );
  };
  let phone = p.phone.replace(/\D/g, '');
  if (/^0[17]\d{8}$/.test(phone)) phone = `254${phone.slice(1)}`;
  if (/^[17]\d{8}$/.test(phone)) phone = `254${phone}`;
  const ready = !!message.trim() && !/\[.*\]/.test(message) && (kind !== 'offer' || consent);
  return (
    <section
      className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5"
      aria-label="Customer message draft"
    >
      <div className="flex justify-between gap-3">
        <h3 className="font-bold">Message {p.name}</h3>
        <button onClick={onClose} className={field}>
          Close draft
        </button>
      </div>
      <p className="my-2 text-sm text-slate-600">
        Review the message, then send it yourself. Opening a draft does not send it.
      </p>
      <label className="block text-sm">
        Message purpose{' '}
        <select className={field} value={kind} onChange={(e) => changeKind(e.target.value)}>
          <option value="thanks">Thank you for your purchase</option>
          <option value="update">Important purchase update</option>
          <option value="offer">Offer / discount</option>
        </select>
      </label>
      <textarea
        aria-label="Message"
        className={`${field} my-3 w-full`}
        rows={6}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {kind === 'offer' && (
        <div className="mb-3 text-sm">
          <p>
            Discount codes are not supported by the current checkout. Only include an offer you have
            already made redeemable.
          </p>
          <label className="mt-2 flex gap-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            This customer agreed to receive promotional messages.
          </label>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={!ready}
          className={action}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message);
              setCopied('Copied');
            } catch {
              setCopied('Select and copy the message above.');
            }
          }}
        >
          Copy message
        </button>
        {ready && /^\d{10,15}$/.test(phone) && (
          <a
            className={action}
            href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open WhatsApp draft
          </a>
        )}
        {ready && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) && (
          <a
            className={action}
            href={`mailto:${encodeURIComponent(p.email)}?subject=Your%20Soma%20AI%20purchase&body=${encodeURIComponent(message)}`}
          >
            Open email draft
          </a>
        )}
        <span role="status">{copied}</span>
      </div>
      {!p.phone && !p.email && (
        <p className="mt-3 text-sm">No contact details were saved for this customer.</p>
      )}
    </section>
  );
}
export function PurchaseReport() {
  const [days, setDays] = useState(30),
    [rows, setRows] = useState<Purchase[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [retry, setRetry] = useState(0),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('All purchases'),
    [status, setStatus] = useState('All statuses'),
    [page, setPage] = useState(0);
  const [contact, setContact] = useState<Purchase | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setRows([]);
    setContact(null);
    supabase.functions
      .invoke('admin-purchases', { body: { days } })
      .then(({ data, error: failure }) => {
        if (!active) return;
        if (failure || data?.error || !Array.isArray(data?.purchases))
          setError(
            data?.error || 'Purchases could not be loaded. Check your admin sign-in and try again.'
          );
        else setRows(data.purchases);
      })
      .catch(() => {
        if (active) setError('Connection failed. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days, retry]);
  useEffect(() => {
    setPage(0);
  }, [days, query, category, status, retry]);
  const totals = useMemo(() => purchaseTotals(rows), [rows]);
  const filtered = rows.filter(
    (r) =>
      (category === 'All purchases' || r.category === category) &&
      (status === 'All statuses' || r.status === status) &&
      [r.name, r.studentId, r.reference, r.phone, r.email, r.product]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase().trim())
  );
  const exportRows = () => {
    const url = URL.createObjectURL(
      new Blob(['\uFEFF', purchaseCsv(filtered)], { type: 'text/csv;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `soma-purchases-${days}-days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-5 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Who bought what</h2>
          <p className="text-sm text-slate-600">
            Learning subscriptions and past-paper purchases in one place.
          </p>
        </div>
        <label className="text-sm">
          Orders created in{' '}
          <select
            aria-label="Reporting period"
            className={field}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[7, 30, 90, 365].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <p role="status">Loading purchases…</p>
      ) : error ? (
        <div role="alert" className="rounded-xl bg-red-50 p-4">
          {error}{' '}
          <button className={field} onClick={() => setRetry((r) => r + 1)}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Successful payments', money(totals.revenue)],
              [
                'Learning subscriptions',
                `${money(totals.subscriptions)} · ${totals.subscriptionOrders} purchases`,
              ],
              ['Past papers', `${money(totals.papers)} · ${totals.paperOrders} purchases`],
              ['Pending payments', String(totals.pending)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border bg-white p-5">
                <p className="text-sm text-slate-600">{label}</p>
                <p className="mt-2 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Totals cover orders created in the selected period, across all filters. Only SUCCESS
            payments count as revenue. Purchase counts are not active subscriber counts.
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              aria-label="Search purchases"
              className={`${field} min-w-0 flex-1`}
              placeholder="Name, Student ID, phone, paper or reference"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Purchase type"
              className={field}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                'All purchases',
                'Learning subscription',
                'Past paper',
                'Learning credits',
                'Marketplace material',
                'Other',
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Payment status"
              className={field}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {['All statuses', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className={field} disabled={!filtered.length} onClick={exportRows}>
              Export filtered CSV
            </button>
            <button className={field} onClick={() => setRetry((r) => r + 1)}>
              Refresh
            </button>
          </div>
          {contact && (
            <ContactDraft key={contact.id} purchase={contact} onClose={() => setContact(null)} />
          )}
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Customer', 'Bought', 'Payment', 'Date / reference', 'Contact'].map((t) => (
                    <th key={t} className="p-4">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(page * 25, page * 25 + 25).map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-4">
                      <strong>{r.name}</strong>
                      <p>
                        {r.studentId ||
                          (r.category === 'Past paper' ? 'Guest purchase' : 'No Student ID')}
                      </p>
                      {r.planStatus && (
                        <p className="text-xs text-slate-500">
                          Current plan: {r.planStatus}
                          {r.planExpiry
                            ? ` · expiry ${new Date(r.planExpiry).toLocaleDateString()}`
                            : ''}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <strong>{r.category}</strong>
                      <p>{r.product}</p>
                    </td>
                    <td className="p-4">
                      <strong>{money(r.amount)}</strong>
                      <p>{r.status}</p>
                    </td>
                    <td className="p-4">
                      <p>{new Date(r.createdAt).toLocaleString()}</p>
                      <details>
                        <summary className="cursor-pointer text-indigo-700">
                          Payment reference
                        </summary>
                        <span className="break-all text-xs">{r.reference}</span>
                      </details>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-slate-500">{r.contactSource}</p>
                      <p>{r.phone || 'No phone saved'}</p>
                      <p className="break-all">{r.email}</p>
                      <button
                        className={`${field} mt-2`}
                        disabled={r.status !== 'SUCCESS'}
                        onClick={() => setContact(r)}
                      >
                        Message buyer
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      No purchases match this period and these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button className={field} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="text-sm">
              {filtered.length} orders · Page {page + 1} of{' '}
              {Math.max(1, Math.ceil(filtered.length / 25))}
            </span>
            <button
              className={field}
              disabled={(page + 1) * 25 >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
