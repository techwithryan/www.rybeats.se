import { useState } from 'react';
import { getCheckoutEndpoint, parseJsonResponse } from '../utils/api';
import './Checkout.css';

const formatSEK = (amount) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(amount);

export default function Checkout({ cart, onClose, onRemoveItem }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const totalPrice = cart.reduce((sum, beat) => sum + Number(beat.price || 0), 0);
  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(getCheckoutEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, email: email.trim() }),
      });

      const payload = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(payload.error || 'Checkout failed');
      }

      if (payload.error) {
        setError(payload.error);
        setLoading(false);
        return;
      }

      window.location.href = payload.url;
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <h2>Checkout</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="checkout-content">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="order-items">
              {cart.map((beat) => (
                <div key={beat.cart_item_id || beat.id} className="order-item">
                  <div className="item-info">
                    <p className="item-name">{beat.name}</p>
                    <p className="item-details">
                      {beat.bpm} BPM • {beat.key} • Commercial rights
                    </p>
                  </div>
                  <div className="item-controls">
                    <p className="item-price">{formatSEK(Number(beat.price || 0))}</p>
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => onRemoveItem(beat.cart_item_id || beat.id)}
                      aria-label={`Remove ${beat.name} from cart`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-divider"></div>

            <div className="order-total">
              <span>Total</span>
              <span className="total-price">{formatSEK(totalPrice)}</span>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="checkout-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="checkout-btn"
            >
              {loading ? 'Processing...' : `Pay ${formatSEK(totalPrice)} with Stripe`}
            </button>

            <p className="payment-info">
              Secure payment powered by Stripe
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}