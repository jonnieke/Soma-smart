# Production Deployment & Domain Setup Guide

Follow these steps to link your domain `somaai.co.ke` from **hosting.com** to your **Vercel** deployment.

## Phase 2: Link the Domain in Vercel

1. **Open Vercel Dashboard**: Go to your project, then click on the **Settings** tab.
2. **Navigate to Domains**: Click on **Domains** in the left sidebar.
3. **Add Domain**:
    * Enter `somaai.co.ke` in the input field.
    * Click **Add**.
    * When asked how to add the domain, select **"Add somaai.co.ke and the www redirect to it"** (recommended).
4. **Get Nameservers**:
    * Vercel will show an error saying "Invalid Configuration". This is normal.
    * Look for the **Nameservers** section. It will list two or more addresses, like:
        * `ns1.vercel-dns.com`
        * `ns2.vercel-dns.com`
    * **Keep this tab open** or copy these addresses.

---

## Phase 3: Update Nameservers at hosting.com

1. **Login to hosting.com**: Go to your client area where you purchased the domain.
2. **Domain Management**: Find `somaai.co.ke` and look for **Nameservers Management**.
3. **Use Custom Nameservers**:
    * Select the option to use **Custom Nameservers**.
    * Delete any existing nameservers.
    * Paste the Vercel nameservers (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) into the fields.
4. **Save Changes**: This will initiate the "Propagation" period.

> [!IMPORTANT]
> DNS changes can take **1 to 24 hours** to take full effect globally. Your site might be accessible in some regions before others.

---

## Phase 4: Final Verification Checklist

Once the domain is "Active" in Vercel (the green checkmark appears), perform these final checks:

### 1. Supabase Auth Redirects

In your **Supabase Dashboard**:

* Go to **Authentication > URL Configuration**.
* In **Site URL**, put `https://somaai.co.ke`.
* In **Redirect URLs**, add `https://somaai.co.ke/**`.
* *This ensures users are sent back to the right place after logging in or resetting passwords.*

### 2. Pesapal IPN Update

- Log in to your **Pesapal Dashboard**.
* Go to the **IPN Settings**.
* **URL**: `https://lpbcxruekqigvcksbkgr.supabase.co/functions/v1/pesapal/ipn-handler`
* **IPN Domain**: `lpbcxruekqigvcksbkgr.supabase.co` (This must match the URL exactly)

### 3. Environment Variables check

In **Vercel Settings > Environment Variables**, double-check that you have:

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`
* `VITE_PESAPAL_CONSUMER_KEY`
* `VITE_PESAPAL_CONSUMER_SECRET`
* `VITE_ELEVENLABS_API_KEY` (if using TTS)
* `VITE_GEMINI_API_KEY`

---

## Need Help?

If you encounter a specific error message in the Vercel dashboard (e.g., "Verification Failed"), tell me the exact text, and I will help you troubleshoot it!
