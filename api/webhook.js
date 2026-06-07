const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generates plain-text license for email
function buildLicense({ licensee, beatName, date, isFree }) {
  return `
COMMERCIAL RIGHTS LICENSE
RyBeats — rybeats.se
------------------------------------------
Licensor:     Ryan Cornelio (RyBeats)
Licensee:     ${licensee}
Beat Title:   ${beatName}
License Type: Non-Exclusive Commercial License${isFree ? ' (Free Download)' : ''}
Date Issued:  ${date}
------------------------------------------

RIGHTS GRANTED
✓ Stream on all major platforms (Spotify, Apple Music, YouTube, etc.)
✓ Use in music videos and social media content
✓ Perform the song at live events
✓ Distribute for free or for profit (up to 10,000 units/streams per platform)
✓ Use in non-commercial projects (demos, school projects)

RESTRICTIONS
✗ This license is non-exclusive. RyBeats retains the right to license the same beat to others.
✗ You may NOT re-sell or sub-license the beat file itself.
✗ You may NOT claim ownership or copyright of the beat.
✗ Credit required: Produced by RyBeats (rybeats.se)
✗ For exclusive rights, contact: ryan.cornelio@gmail.com

REQUIRED CREDIT
In all releases: "Prod. by RyBeats (rybeats.se)"

By downloading and/or using this beat, you agree to the terms above.

------------------------------------------
RyBeats • rybeats.se • ryan.cornelio@gmail.com
`.trim();
}

async function sendLicenseEmail({ email, beatName, downloadUrl, isFree }) {
  const date = new Date().toLocaleDateString('sv-SE');
  const licenseText = buildLicense({ licensee: email, beatName, date, isFree });

  const response = await fetch('https://connect.mailerlite.com/api/campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
    },
    body: JSON.stringify({
      name: `License - ${beatName} - ${email}`,
      type: 'regular',
      emails: [{
        subject: `Your beat is ready — ${beatName}`,
        from_name: 'RyBeats',
        from: 'ryan.cornelio@gmail.com',
        content: `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#080810;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#8b5cf6,transparent);"></td></tr>
      <tr><td style="background:#0d0d18;padding:40px 44px 32px;">
        <p style="margin:0 0 24px;font-size:10px;letter-spacing:0.2em;color:#8b5cf6;text-transform:uppercase;">RyBeats</p>
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f0eeff;letter-spacing:-0.02em;">Your beat is ready.</h1>
        <div style="width:32px;height:1px;background:#8b5cf6;margin:0 0 24px;"></div>
        <p style="margin:0 0 16px;font-size:14px;color:#9898b8;line-height:1.85;">
          <strong style="color:#f0eeff;">${beatName}</strong> — commercial license included below.
        </p>
        <p style="margin:0 0 32px;font-size:14px;color:#9898b8;line-height:1.85;">
          Credit the beat as: <strong style="color:#f0eeff;">Prod. by RyBeats (rybeats.se)</strong>
        </p>
        ${downloadUrl ? `
        <table cellpadding="0" cellspacing="0" style="margin:0 0 36px;">
          <tr><td style="border:1px solid #8b5cf6;border-radius:2px;">
            <a href="${downloadUrl}" style="display:inline-block;padding:14px 36px;font-size:12px;font-weight:700;color:#f0eeff;text-decoration:none;letter-spacing:0.15em;text-transform:uppercase;">
              Download Beat &nbsp;→
            </a>
          </td></tr>
        </table>` : ''}
        <div style="height:1px;background:#1e1e2e;margin:0 0 24px;"></div>
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.1em;color:#555570;text-transform:uppercase;">Your License</p>
        <pre style="margin:0 0 32px;font-size:11px;color:#6666aa;line-height:1.7;white-space:pre-wrap;font-family:monospace;background:#0a0a14;padding:16px;border-radius:4px;">${licenseText}</pre>
        <div style="height:1px;background:#1e1e2e;margin:0 0 24px;"></div>
        <p style="margin:0 0 4px;font-size:13px;color:#f0eeff;">Ryan — RyBeats</p>
        <a href="https://www.rybeats.se" style="font-size:11px;color:#7b5ea7;text-decoration:none;">rybeats.se</a>
      </td></tr>
      <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#8b5cf6,transparent);"></td></tr>
      <tr><td style="background:#080810;padding:20px 44px 0;">
        <p style="margin:0;font-size:10px;color:#2e2e48;text-align:center;letter-spacing:0.06em;">
          RyBeats • RYBEATS.SE
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`MailerLite campaign error: ${JSON.stringify(err)}`);
  }

  // Also add buyer to MailerLite list with "buyer" tag
  await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
    },
    body: JSON.stringify({
      email,
      groups: [process.env.MAILERLITE_GROUP_ID],
      fields: { beat_purchased: beatName },
      status: 'active',
    }),
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email || session.metadata?.email;
    const beatIds = session.metadata?.beat_ids?.split(',') || [];
    const isFree = session.amount_total === 0;

    if (!email || beatIds.length === 0) {
      console.error('Missing email or beat_ids in session metadata');
      return res.status(200).json({ received: true });
    }

    try {
      // Fetch beat details from Supabase
      const { data: beats, error } = await supabase
        .from('beats')
        .select('id, name, file_url')
        .in('id', beatIds);

      if (error) throw error;

      // Send one license email per beat
      for (const beat of beats) {
        await sendLicenseEmail({
          email,
          beatName: beat.name,
          downloadUrl: beat.file_url,
          isFree,
        });
      }
    } catch (err) {
      console.error('Post-purchase error:', err);
    }
  }

  return res.status(200).json({ received: true });
};