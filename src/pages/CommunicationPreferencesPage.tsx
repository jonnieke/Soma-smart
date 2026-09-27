import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SomaCommunityInvite } from '../components/SomaCommunityInvite';
import { communicationPreferencesService as service, defaultPreferences } from '../services/communicationPreferencesService';

export default function CommunicationPreferencesPage() {
  const [preferences, setPreferences] = useState({ ...defaultPreferences });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    service.load().then(value => { if (active) { setPreferences(value); setReady(true); } })
      .catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);
  const save = async () => {
    setBusy(true); setMessage('');
    try { await service.save(preferences); setMessage('Preferences saved. You can change them here at any time.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save. Please retry.'); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-2xl px-5 py-10 text-slate-900">
    <Link to="/" className="text-indigo-700 underline">Soma homepage</Link>
    <h1 className="mt-6 text-3xl font-bold">How would you like to hear from Soma?</h1>
    <p className="my-4">Choose where to receive new-material and feature updates. Buying a paper or subscription does not sign you up for marketing.</p>
    <fieldset disabled={!ready || busy} className="space-y-5 rounded-2xl border bg-white p-6 disabled:opacity-60">
      <legend className="px-2 font-semibold">Optional updates</legend>
      {([['inApp', 'Inside Soma'], ['email', 'Email updates'], ['whatsapp', 'WhatsApp updates']] as const).map(([key, label]) =>
        <label key={key} className="flex items-center gap-3"><input type="checkbox" checked={preferences[key]} onChange={e => setPreferences({ ...preferences, [key]: e.target.checked })} />{label}</label>)}
      <p className="text-sm text-slate-600">Email and WhatsApp delivery are not active in this rollout. These choices record your interest; contact verification is still required before delivery. Use only your own contact details, or an authorised parent/guardian’s details.</p>
      <p className="text-sm text-slate-600">These choices do not change your paid access or essential payment/account notices. Uncheck a channel and save to opt out.</p>
      <button onClick={() => void save()} className="rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white">{busy ? 'Saving…' : 'Save preferences'}</button>
    </fieldset>
    {message && <p role="status" className="mt-4 rounded-xl bg-slate-100 p-4">{message}</p>}
    {!ready && !message && <p role="status">Loading preferences…</p>}
    <div className="mt-6"><SomaCommunityInvite /></div>
    <p className="mt-6 text-sm">Need help? <a className="text-indigo-700 underline" href="https://wa.me/254722763760" target="_blank" rel="noopener noreferrer">Contact Soma support</a></p>
  </main>;
}
