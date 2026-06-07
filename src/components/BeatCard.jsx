import { useState, useEffect } from 'react';
import './BeatCard.css';

// Currency config per country code
const CURRENCY_MAP = {
  SE: { code: 'SEK', locale: 'sv-SE' },
  NO: { code: 'NOK', locale: 'nb-NO' },
  DK: { code: 'DKK', locale: 'da-DK' },
  FI: { code: 'EUR', locale: 'fi-FI' },
  DE: { code: 'EUR', locale: 'de-DE' },
  FR: { code: 'EUR', locale: 'fr-FR' },
  NL: { code: 'EUR', locale: 'nl-NL' },
  ES: { code: 'EUR', locale: 'es-ES' },
  IT: { code: 'EUR', locale: 'it-IT' },
  GB: { code: 'GBP', locale: 'en-GB' },
  // All other countries default to USD
};

// Exchange rates relative to SEK (approximate)
// In production, replace with a live exchange rate API
const EXCHANGE_RATES = {
  SEK: 1,
  NOK: 0.97,
  DKK: 0.68,
  EUR: 0.088,
  GBP: 0.075,
  USD: 0.092,
};



let cachedCurrency = { code: 'SEK', locale: 'sv-SE' };

async function detectCurrency() {
  if (cachedCurrency) return cachedCurrency;
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const countryCode = data.country_code;
cachedCurrency = CURRENCY_MAP[countryCode] || { code: 'USD', locale: 'en-US' };
  } catch {
  cachedCurrency = { code: 'USD', locale: 'en-US' };
}
  return cachedCurrency;
}

function formatPrice(amountInSEK, currencyInfo) {
  const rate = EXCHANGE_RATES[currencyInfo.code] || EXCHANGE_RATES['USD'];
  const converted = Math.round(amountInSEK * rate);
  return new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currencyInfo.code,
    maximumFractionDigits: 0,
  }).format(converted);
}

export default function BeatCard({
  beat,
  onPlay,
  onAddCart,
  onDelete,
  isPlaying,
  currentBeat,
  canDelete = false,
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [currencyInfo, setCurrencyInfo] = useState({ code: 'SEK', locale: 'sv-SE' });

  useEffect(() => {
    detectCurrency().then(setCurrencyInfo);
  }, []);

  const isBeatPlaying = isPlaying && currentBeat?.id === beat.id;

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    if (isBeatPlaying) {
      onPlay(null);
    } else {
      onPlay(beat);
    }
  };

  const handleQuickPlay = (e) => {
    e.stopPropagation();
    if (isBeatPlaying) {
      onPlay(null);
    } else {
      onPlay(beat);
    }
  };

  const price = Number(beat.price || 0);

  return (
    <div
      className={`beat-card ${isBeatPlaying ? 'playing' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleCardClick}
    >
      {/* Image Section with Play Overlay */}
      <div className="beat-image-container">
        {beat.image_url && (
          <img src={beat.image_url} alt={beat.name} className="beat-image" />
        )}
        {/* Play/Pause Overlay */}
        <div className={`play-overlay ${isHovering || isBeatPlaying ? 'visible' : ''}`}>
          <button
            className={`play-icon ${isBeatPlaying ? 'playing' : ''}`}
            onClick={handleQuickPlay}
          >
            {isBeatPlaying ? '⏸' : '▶'}
          </button>
        </div>
        {/* Playing Indicator */}
        {isBeatPlaying && (
          <div className="playing-indicator">
            <div className="pulse"></div>
            <div className="pulse"></div>
            <div className="pulse"></div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="beat-info">
        <h3 className="beat-name">{beat.name}</h3>
        <p className="beat-details">
          {beat.bpm} BPM • <span className="beat-key">{beat.key}</span>
        </p>
        <p className="beat-license-label">Commercial rights</p>
        <p className="beat-price">{formatPrice(price, currencyInfo)}</p>
      </div>

      {/* Actions */}
      <div className={`beat-actions ${isHovering ? 'visible' : ''}`}>
        <button
          className="action-btn buy-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddCart(beat);
          }}
          title="Add to cart"
        >
          Add to Cart
        </button>
        {canDelete && (
          <button
            className="action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(beat.id);
            }}
            title="Delete beat"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}