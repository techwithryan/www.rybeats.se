import { useEffect, useState } from 'react';
import { parseJsonResponse } from '../utils/api';
import './SuccessModal.css';

export default function SuccessModal({ sessionId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Missing session ID');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(
          `/api/session-status?session_id=${encodeURIComponent(sessionId)}`
        );
        const data = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setOrderDetails(data);
      } catch (err) {
        setError(err.message || 'Could not verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="success-overlay" onClick={onClose}>
      <div className="success-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="success-close-btn" onClick={onClose} aria-label="Close success page">
          ✕
        </button>

        {loading && (
          <div className="success-loader-container">
            <div className="success-spinner"></div>
            <p>Verifying your payment with Stripe...</p>
          </div>
        )}

        {error && (
          <div className="success-error-container">
            <div className="error-icon">⚠️</div>
            <h3>Verification Issue</h3>
            <p>{error}</p>
            <button type="button" className="retry-btn" onClick={() => window.location.reload()}>
              Retry Verification
            </button>
          </div>
        )}

        {!loading && !error && orderDetails && (
          <div className="success-content">
            <div className="success-badge">
              <svg viewBox="0 0 24 24" className="checkmark-svg">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>

            <h2>Thank you for your purchase!</h2>
            <p className="success-subtitle">
              Your payment has been successfully processed. An order confirmation has been sent to{' '}
              <strong>{orderDetails.customer_email}</strong>.
            </p>

            <div className="beats-download-section">
              <h3>Your Purchased Beats</h3>
              <div className="beats-download-list">
                {orderDetails.beats.length === 0 ? (
                  <p className="no-beats-msg">No beats found in this order metadata.</p>
                ) : (
                  orderDetails.beats.map((beat) => (
                    <div key={beat.id} className="download-item">
                      <div className="download-item-left">
                        {beat.image_url && (
                          <img src={beat.image_url} alt={beat.name} className="download-item-img" />
                        )}
                        <div className="download-item-info">
                          <h4>{beat.name}</h4>
                          <p>
                            {beat.bpm} BPM • {beat.key}
                          </p>
                        </div>
                      </div>
                      <a
                        href={beat.file_url}
                        download={`${beat.name}.mp3`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-btn-link"
                      >
                        Download Audio
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button type="button" className="success-done-btn" onClick={onClose}>
              Back to Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
