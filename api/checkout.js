const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getSupabase } = require('./supabaseServer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { items = [], email } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }
    if (items.length > 20) {
      return res.status(400).json({ error: 'Too many items' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const beatIds = items.map((item) => item.id).filter(Boolean);
    if (beatIds.length !== items.length) {
      return res.status(400).json({ error: 'Invalid item data' });
    }

    // Hämta priser direkt från Supabase — frontend-priset ignoreras helt
    const supabase = getSupabase();
    const { data: beats, error: dbError } = await supabase
      .from('beats')
      .select('id, name, bpm, key, price, file_url')
      .in('id', beatIds);

    if (dbError || !beats || beats.length === 0) {
      console.error('Supabase error:', dbError);
      return res.status(400).json({ error: 'Could not fetch beat data' });
    }

    if (beats.length !== beatIds.length) {
      return res.status(400).json({ error: 'One or more beats not found' });
    }

    const origin = req.headers.origin || process.env.DOMAIN || 'https://rybeats.se';
    const beatIdsStr = beatIds.map(String).join(',');

    const isFree = beats.every((beat) => Number(beat.price || 0) === 0);

    // Free beat — skicka licens direkt, ingen Stripe-session
    if (isFree) {
      fetch(`${origin}/api/send-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, beatIds: beatIdsStr, isFree: true }),
      }).catch((err) => console.error('send-license error:', err));

      return res.status(200).json({
        url: `${origin}/?payment=success&free=true`,
      });
    }

    // Betalt — bygg lineItems med pris från Supabase
    const lineItems = beats.map((beat) => {
      const unitAmount = Math.round(Number(beat.price) * 100);
      if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
        throw new Error(`Invalid price for "${beat.name}".`);
      }
      return {
        price_data: {
          currency: 'sek',
          product_data: {
            name: `${beat.name} — Commercial Rights`,
            description: `${beat.bpm} BPM • ${beat.key}`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: {
        beat_ids: beatIdsStr,
        email,
      },
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancel`,
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    const message =
      error?.raw?.message || error?.message || 'Payment session could not be created';
    const status = error?.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    return res.status(status).json({ error: message });
  }
};
