const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { items = [], email } = req.body || {};

        // Validera items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        if (items.length > 20) {
            return res.status(400).json({ error: 'Too many items' });
        }

        // Validera email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        // Validera att varje item har id och namn
        for (const item of items) {
            if (!item.id || !item.name) {
                return res.status(400).json({ error: 'Invalid item data' });
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email || undefined,
            line_items: items.map((beat) => ({
                price_data: {
                    currency: 'sek',
                    product_data: {
                        name: `${beat.name} - Commercial Rights`,
                    },
                    unit_amount: 19900,
                },
                quantity: 1,
            })),
            mode: 'payment',
            metadata: {
                beat_ids: items.map((beat) => String(beat.id)).join(','),
                email: email || '',
            },
            success_url: `https://rybeats.se/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://rybeats.se/?payment=cancel`,
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe error:', error);
        return res.status(500).json({ error: 'Payment session could not be created' });
    }
};