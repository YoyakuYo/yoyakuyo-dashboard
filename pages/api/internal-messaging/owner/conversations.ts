import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Attempt to fetch conversations for the owner, including a display name for the customer
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `id,
       conversation_type,
       target_type,
       target_id,
       shop_id,
       booking_id,
       customer_ref,
       last_message_at,
       unread_count,
       shop ( id, name ),
       customer ( id, name, email, display_name )`
    )
    // The actual owner filter may differ in your schema; adapt as needed
    .eq('owner_id', userId)
    .order('last_message_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const conversationsWithDisplay = (data || []).map((conv: any) => {
    const customer = conv.customer || {};
    const displayName =
      customer.display_name ||
      customer.name ||
      (customer.email ? customer.email.split('@')[0].charAt(0).toUpperCase() + customer.email.split('@')[0].slice(1) : 'Customer');
    return {
      ...conv,
      customer_display_name: displayName
    };
  });

  res.status(200).json({ conversations: conversationsWithDisplay });
}

