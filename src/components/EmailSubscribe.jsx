import { useState } from 'react';
import './EmailSubscribe.css';

export default function EmailSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        const data = await res.json();
        setErrorMsg(data?.message || 'Something went wrong. Try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  return (
    <section className="subscribe-section">
      <div className="subscribe-inner">
        <div className="subscribe-label">STAY IN THE LOOP</div>
        <h2 className="subscribe-heading">
          New beats. Exclusive drops.<br />First access.
        </h2>
        <p className="subscribe-sub">
          Join the list and be the first to know when new beats land.
        </p>

        {status === 'success' ? (
          <div className="subscribe-success">
            <span className="subscribe-success-icon">✓</span>
            You're in. New beats coming your way.
          </div>
        ) : (
          <form className="subscribe-form" onSubmit={handleSubmit}>
            <div className="subscribe-input-wrap">
              <input
                type="email"
                className="subscribe-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                className={`subscribe-btn ${status === 'loading' ? 'loading' : ''}`}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <span className="subscribe-spinner" />
                ) : (
                  'Join'
                )}
              </button>
            </div>
            {status === 'error' && (
              <p className="subscribe-error">{errorMsg}</p>
            )}
          </form>
        )}

        <p className="subscribe-fine">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}