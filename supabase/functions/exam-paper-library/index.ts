import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { handlePaperLibraryRequest } from '../_shared/paperLibrary.ts';

Deno.serve((req: Request) =>
  handlePaperLibraryRequest(req, async (buyerToken, from, to) => {
    // Privileged client stays on the server. Every lookup is constrained by BOTH
    // the caller's purchase capability and a confirmed successful payment.
    const client = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    return await client
      .from('exam_paper_orders')
      .select('exam_id')
      .eq('buyer_token', buyerToken)
      .eq('status', 'SUCCESS')
      .order('id', { ascending: true })
      .range(from, to);
  })
);
