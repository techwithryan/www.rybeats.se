import { useState, useEffect } from 'react';
import { useLike } from '../utils/likesStorage';
import './BeatRow.css';

// ── Currency ──────────────────────────────────────────────────────────────────
const CURRENCY_MAP = {
  SE: { code: 'SEK', locale: 'sv-SE' }, NO: { code: 'NOK', locale: 'nb-NO' },
  DK: { code: 'DKK', locale: 'da-DK' }, FI: { code: 'EUR', locale: 'fi-FI' },
  DE: { code: 'EUR', locale: 'de-DE' }, FR: { code: 'EUR', locale: 'fr-FR' },
  NL: { code: 'EUR', locale: 'nl-NL' }, ES: { code: 'EUR', locale: 'es-ES' },
  IT: { code: 'EUR', locale: 'it-IT' }, GB: { code: 'GBP', locale: 'en-GB' },
};
const EXCHANGE_RATES = { SEK: 1, NOK: 0.97, DKK: 0.68, EUR: 0.088, GBP: 0.075, USD: 0.092 };
let cachedCurrency = { code: 'SEK', locale: 'sv-SE' };
async function detectCurrency() {
  if (cachedCurrency) return cachedCurrency;
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    cachedCurrency = CURRENCY_MAP[data.country_code] || { code: 'USD', locale: 'en-US' };
  } catch { cachedCurrency = { code: 'USD', locale: 'en-US' }; }
  return cachedCurrency;
}
function formatPrice(amountInSEK, currencyInfo) {
  const rate = EXCHANGE_RATES[currencyInfo.code] || EXCHANGE_RATES['USD'];
  const converted = Math.round(amountInSEK * rate);
  return new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency', currency: currencyInfo.code, maximumFractionDigits: 0,
  }).format(converted);
}

// ── EQ bars ───────────────────────────────────────────────────────────────────
function EqBars() {
  return (
    <span className="eq-bars" aria-hidden="true">
      <span className="eq-bar" /><span className="eq-bar" />
      <span className="eq-bar" /><span className="eq-bar" />
    </span>
  );
}

// ── BeatRow ───────────────────────────────────────────────────────────────────
export default function BeatRow({ beat, index, onPlay, onAddCart, onDelete, isPlaying, currentBeat, canDelete = false }) {
  const [currencyInfo, setCurrencyInfo] = useState({ code: 'SEK', locale: 'sv-SE' });
  useEffect(() => { detectCurrency().then(setCurrencyInfo); }, []);

  const { liked, toggle: toggleLike } = useLike(beat.id);
  const isBeatPlaying = isPlaying && currentBeat?.id === beat.id;
  const price = Number(beat.price || 0);
  const isFree = price === 0;

  const handleRowClick = (e) => {
    if (e.target.closest('button')) return;
    isBeatPlaying ? onPlay(null) : onPlay(beat);
  };

  return (
    <div
      className={`beat-row${isBeatPlaying ? ' beat-row--playing' : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleRowClick(e)}
    >
      {/* Col 1: play */}
      <div className="beat-row__play-col">
        <button
          className={`beat-row__play-btn${isBeatPlaying ? ' beat-row__play-btn--playing' : ''}`}
          onClick={(e) => { e.stopPropagation(); isBeatPlaying ? onPlay(null) : onPlay(beat); }}
          aria-label={isBeatPlaying ? `Pause ${beat.name}` : `Play ${beat.name}`}
        >
          {isBeatPlaying ? <EqBars /> : <span className="beat-row__index">{String(index + 1).padStart(2, '0')}</span>}
          <span className="beat-row__play-icon">
            {isBeatPlaying
              ? <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5.14v14l11-7-11-7z"/></svg>
            }
          </span>
        </button>
      </div>

      {/* Col 2: thumbnail */}
      <div className="beat-row__thumb-col">
        <div className="beat-row__thumb">
          {beat.image_url
            ? <img src={beat.image_url} alt={beat.name} />
            : <span className="beat-row__thumb-placeholder" />}
        </div>
      </div>

      {/* Col 3: meta */}
      <div className="beat-row__meta-col">
        <span className="beat-row__name">{beat.name}</span>
        <span className="beat-row__sub">
          <span className="beat-row__bpm">{beat.bpm} BPM</span>
          {beat.key && <span className="beat-row__key">{beat.key}</span>}
        </span>
      </div>

      {/* Col 4: license */}
      <div className="beat-row__license-col">
        <span className="beat-row__license">{isFree ? 'Free download' : '3 licenses'}</span>
      </div>

      {/* Col 5: price — FREE badge or "from X" */}
      <div className="beat-row__price-col">
        {isFree ? (
          <span className="beat-row__price-free">FREE</span>
        ) : (
          <>
            <span className="beat-row__price-from">from</span>
            <span className="beat-row__price">{formatPrice(price, currencyInfo)}</span>
          </>
        )}
      </div>

      {/* Col 6: actions — heart + cart + delete */}
      <div className="beat-row__actions-col">
        {/* Like button — always visible when liked, otherwise shows on hover */}
        <button
          className={`beat-row__like-btn${liked ? ' beat-row__like-btn--active' : ''}`}
          onClick={toggleLike}
          aria-label={liked ? `Unlike ${beat.name}` : `Like ${beat.name}`}
          title={liked ? 'Remove from liked' : 'Save to liked'}
        >
          <svg viewBox="0 0 24 24" width="17" height="17"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <button
          className="beat-row__cart-btn"
          onClick={(e) => { e.stopPropagation(); onAddCart(beat); }}
          aria-label={isFree ? `Download ${beat.name}` : `Add ${beat.name} to cart`}
        >
          {isFree ? 'Download' : 'Add to Cart'}
        </button>

        {canDelete && (
          <button
            className="beat-row__delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(beat.id); }}
            aria-label={`Delete ${beat.name}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
