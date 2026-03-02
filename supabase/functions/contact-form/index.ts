
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
    // handle CORS for options request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { name, contact, message } = await req.json();

        // 1. Validate Input
        if (!name || !contact || !message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        // 2. Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Use anon key for public inserts if RLS allows, or SERVICE_ROLE_KEY if bypassing.
            // Wait, we need to insert into contact_messages. It has "Allow public insert" policy.
            // So anon key is fine.
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 3. Store in Database
        const { error: dbError } = await supabaseClient
            .from('contact_messages')
            .insert({ name, contact, message });

        if (dbError) {
            console.error('Database Error:', dbError);
            return new Response(
                JSON.stringify({ error: 'Failed to save message' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        // 4. Send Email via Resend
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (RESEND_API_KEY) {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: 'Soma Smart <onboarding@resend.dev>', // Should be verified domain eventually, usually onboarding@resend.dev works for testing to your own email
                    to: ['info@somaai.co.ke'],
                    subject: `New Contact Form Message from ${name}`,
                    html: `
            <h3>New Message Received</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Contact:</strong> ${contact}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `,
                }),
            });

            if (!res.ok) {
                const errorData = await res.text();
                console.error('Resend API Error:', errorData);
                // We don't fail the request if email fails, since we saved to DB.
            }
        } else {
            console.warn('RESEND_API_KEY not set. Email skipped.');
        }

        return new Response(
            JSON.stringify({ message: 'Message sent successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
