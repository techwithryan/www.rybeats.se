/**
 * Local dev API — mirrors Vercel serverless routes so CRA can proxy /api/*.
 * Run: npm run dev:api (port 3001). Use npm run dev to start API + React together.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

const checkout = require('../api/checkout');
const createCheckoutSession = require('../api/create-checkout-session');
const sessionStatus = require('../api/session-status');
const sendLicense = require('../api/send-license');
const subscribe = require('../api/subscribe');

app.post('/api/checkout', wrap(checkout));
app.post('/api/create-checkout-session', wrap(createCheckoutSession));
app.get('/api/session-status', wrap(sessionStatus));
app.post('/api/send-license', wrap(sendLicense));
app.post('/api/subscribe', wrap(subscribe));

const port = Number(process.env.DEV_API_PORT) || 3001;
app.listen(port, () => {
  console.log(`Local API listening on http://127.0.0.1:${port}`);
});
