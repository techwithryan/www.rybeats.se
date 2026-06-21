import { useState, useEffect, useCallback } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { getHeroImageUrl } from '../utils/heroImage';
import './Hero.css';

// Inject a <link rel="preload"> into <head> so the browser fetches
// the hero image as early as possible — before React even renders.
function preloadHeroImage(url) {
  if (!url) return;
  const existing = document.querySelector('link[data-hero-preload]');
  if (existing) { existing.href = url; return; }
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as  = 'image';
  link.href = url;
  link.setAttribute('data-hero-preload', '1');
  document.head.appendChild(link);
}

export default function Hero({ onNavigate }) {
  // Use stable URL (no cache-bust) so browser cache works across visits
  const [heroImage, setHeroImage] = useState(() => {
    const url = getHeroImageUrl();
    preloadHeroImage(url);
    return url;
  });

  const reloadHeroImage = useCallback(() => {
    const url = getHeroImageUrl();
    preloadHeroImage(url);
    setHeroImage(url);
  }, []);

  useEffect(() => {
    const onSettingsUpdated = (event) => {
      if (!event.detail?.type || event.detail.type === 'hero') {
        // After an upload we want fresh — add cache-bust just this once
        import('../utils/heroImage').then(({ getHeroImageUrlFresh }) => {
          const url = getHeroImageUrlFresh();
          preloadHeroImage(url);
          setHeroImage(url);
        });
      }
    };
    window.addEventListener('rybeats-settings-updated', onSettingsUpdated);
    return () => window.removeEventListener('rybeats-settings-updated', onSettingsUpdated);
  }, [reloadHeroImage]);

  return (
    <section className="hero">
      <div className="hero-media">
        {heroImage ? (
          <img
            src={heroImage}
            alt="RyBeats hero artwork"
            className="hero-image"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <div className="hero-image hero-image-fallback" aria-hidden="true"></div>
        )}
        <div className="hero-overlay" aria-hidden="true"></div>
      </div>

      <div className="hero-content">
        <p className="hero-kicker">RyBeats</p>
        <h1>Premium HipHop & Trap Production</h1>
        <p className="hero-subtitle">
          Release-ready beats engineered for artists who want a modern, high-end sound.
        </p>

        <div className="hero-cta-row">
          <button type="button" className="hero-cta primary" onClick={() => onNavigate('store')}>
            Browse Beats
          </button>
          <button type="button" className="hero-cta secondary" onClick={() => onNavigate('media')}>
            Collab / Contact
          </button>
        </div>

        <div className="hero-social-links">
          <a
            href="https://open.spotify.com/artist/5tS4sV7dbDsRzUAWEefXkS"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link spotify"
            aria-label="Open RyBeats on Spotify"
          >
            <i className="fab fa-spotify"></i>
          </a>
          <a
            href="https://www.youtube.com/@rybeatsofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link youtube"
            aria-label="Open RyBeats on YouTube"
          >
            <i className="fab fa-youtube"></i>
          </a>
        </div>
      </div>
    </section>
  );
}
