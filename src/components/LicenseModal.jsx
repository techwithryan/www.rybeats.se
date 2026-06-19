import './LicenseModal.css';

// ── License definitions ───────────────────────────────────────────────────────
export const LICENSES = [
  {
    id: 'basic',
    name: 'Basic',
    tag: null,
    description: 'MP3 only. Perfect for demos, SoundCloud, and early releases.',
    multiplier: 1, // base price × 1
    color: 'var(--ink-3)',
    features: [
      { label: 'MP3 (320kbps)', included: true },
      { label: 'WAV (lossless)', included: false },
      { label: 'Trackouts / stems', included: false },
      { label: 'YouTube & streaming', included: true },
      { label: 'Music videos', included: true },
      { label: 'Film, TV & advertising', included: false },
      { label: 'Non-exclusive', included: true },
      { label: 'Producer credit required', included: true },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tag: 'Most popular',
    description: 'WAV + trackouts. Industry-ready quality for serious releases.',
    multiplier: 2, // base price × 2
    color: 'var(--accent)',
    features: [
      { label: 'MP3 (320kbps)', included: true },
      { label: 'WAV (lossless)', included: true },
      { label: 'Trackouts / stems', included: true },
      { label: 'YouTube & streaming', included: true },
      { label: 'Music videos', included: true },
      { label: 'Film, TV & advertising', included: false },
      { label: 'Non-exclusive', included: true },
      { label: 'Producer credit required', included: true },
    ],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    tag: null,
    description: 'Full clearance. Use anywhere — film, TV, ads, sync.',
    multiplier: 4, // base price × 4
    color: '#a78bfa',
    features: [
      { label: 'MP3 (320kbps)', included: true },
      { label: 'WAV (lossless)', included: true },
      { label: 'Trackouts / stems', included: true },
      { label: 'YouTube & streaming', included: true },
      { label: 'Music videos', included: true },
      { label: 'Film, TV & advertising', included: true },
      { label: 'Non-exclusive', included: true },
      { label: 'Producer credit required', included: false },
    ],
  },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// ── Format price ──────────────────────────────────────────────────────────────
function formatPrice(basePrice, multiplier, currencyInfo) {
  const amount = Math.round(basePrice * multiplier);
  const rate = {
    SEK: 1, NOK: 0.97, DKK: 0.68,
    EUR: 0.088, GBP: 0.075, USD: 0.092,
  }[currencyInfo?.code] || 0.092;
  const converted = Math.round(amount * rate);
  return new Intl.NumberFormat(currencyInfo?.locale || 'en-US', {
    style: 'currency',
    currency: currencyInfo?.code || 'USD',
    maximumFractionDigits: 0,
  }).format(converted);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LicenseModal({ beat, onClose, onAddCart, currencyInfo }) {
  if (!beat) return null;

  const handleSelect = (license) => {
    // Pass beat with license info and adjusted price to cart
    onAddCart({
      ...beat,
      license_id: license.id,
      license_name: license.name,
      price: Math.round(Number(beat.price || 0) * license.multiplier),
      display_name: `${beat.name} — ${license.name}`,
    });
    onClose();
  };

  return (
    <div className="lm-overlay" onClick={onClose}>
      <div className="lm-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="lm-header">
          <div className="lm-header-info">
            {beat.image_url && (
              <img src={beat.image_url} alt={beat.name} className="lm-thumb" />
            )}
            <div>
              <p className="lm-beat-name">{beat.name}</p>
              <p className="lm-beat-meta">{beat.bpm} BPM · {beat.key}</p>
            </div>
          </div>
          <button className="lm-close" onClick={onClose} aria-label="Close">
            <IconX />
          </button>
        </div>

        <p className="lm-subtitle">Choose your license</p>

        {/* License cards */}
        <div className="lm-cards">
          {LICENSES.map((license) => (
            <div
              key={license.id}
              className={`lm-card${license.tag ? ' lm-card--featured' : ''}`}
              style={{ '--lm-accent': license.color }}
            >
              {license.tag && (
                <span className="lm-badge">{license.tag}</span>
              )}

              <div className="lm-card-header">
                <span className="lm-card-name" style={{ color: license.color }}>
                  {license.name}
                </span>
                <span className="lm-card-price">
                  {formatPrice(Number(beat.price || 0), license.multiplier, currencyInfo)}
                </span>
              </div>

              <p className="lm-card-desc">{license.description}</p>

              <ul className="lm-features">
                {license.features.map((f) => (
                  <li
                    key={f.label}
                    className={`lm-feature${f.included ? ' lm-feature--yes' : ' lm-feature--no'}`}
                  >
                    <span className="lm-feature-icon">
                      {f.included ? <IconCheck /> : <IconX />}
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>

              <button
                className="lm-select-btn"
                style={{ '--lm-accent': license.color }}
                onClick={() => handleSelect(license)}
              >
                Select {license.name}
              </button>
            </div>
          ))}
        </div>

        <p className="lm-footer-note">
          All licenses are non-exclusive. RyBeats retains the right to license the beat to others.
        </p>
      </div>
    </div>
  );
}
