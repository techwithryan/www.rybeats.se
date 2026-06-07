const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { session_id } = req.query;

  // Validera session_id format — Stripe session IDs börjar alltid med "cs_"
  if (!session_id || !session_id.startsWith('cs_') || session_id.length > 200) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const beatIdsString = session.metadata?.beat_ids || '';

    if (!beatIdsString) {
      return res.status(200).json({
        status: session.payment_status,
        customer_email: session.customer_details?.email || session.customer_email || '',
        beats: [],
      });
    }

    const beatIds = beatIdsString
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (beatIds.length === 0) {
      return res.status(200).json({
        status: session.payment_status,
        customer_email: session.customer_details?.email || session.customer_email || '',
        beats: [],
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: beats, error: dbError } = await supabase
      .from('beats')
      .select('id, name, bpm, key, image_url, file_url') // ← bara nödvändiga fält, inte *
      .in('id', beatIds);

    if (dbError) {
      console.error('Supabase error:', dbError);
      return res.status(500).json({ error: 'Could not retrieve order details' });
    }

    return res.status(200).json({
      status: session.payment_status,
      customer_email: session.customer_details?.email || session.customer_email || '',
      beats: beats || [],
    });
  } catch (error) {
    console.error('Session status error:', error);
    return res.status(500).json({ error: 'Could not verify payment' });
  }
};