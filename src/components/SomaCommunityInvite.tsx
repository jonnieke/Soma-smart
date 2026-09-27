const COMMUNITY_INVITE_URL = 'https://chat.whatsapp.com/GOUM9g5U75s4YcUcW0j8yS';

export function SomaCommunityInvite() {
  return <section aria-label="Optional Soma community" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-slate-900">
    <h3 className="font-semibold">Stay connected with Soma</h3>
    <p className="mt-2 text-sm">Join our WhatsApp community for learning materials and Soma news. Joining is optional and does not affect your paid access.</p>
    <a href={COMMUNITY_INVITE_URL} target="_blank" rel="noopener noreferrer"
      className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-900 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
      Join the Soma community (opens WhatsApp)
    </a>
    <p className="mt-2 text-xs text-slate-600">You choose whether to join in WhatsApp. This does not change your Soma update preferences. Manage or leave the community in WhatsApp. Do not share PINs or payment details in the community.</p>
  </section>;
}
