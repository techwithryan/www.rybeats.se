module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address.' });
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        groups: [process.env.MAILERLITE_GROUP_ID],
        status: 'active',
      }),
    });

    if (!response.ok && response.status !== 409) {
      const err = await response.json();
      console.error('MailerLite error:', err);
      return res.status(500).json({ message: 'Could not subscribe. Please try again.' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
