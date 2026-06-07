import { useState, useEffect, useCallback } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { fetchHeroImageUrl } from '../utils/heroImage';
import './Hero.css';

export default function Hero({ onNavigate }) {
  const [heroImage, setHeroImage] = useState(null);

  const loadHeroImage = useCallback(async () => {
    const url = await fetchHeroImageUrl();
    setHeroImage(url);
  }, []);

  useEffect(() => {
    loadHeroImage();

    const onSettingsUpdated = (event) => {
      if (!event.detail?.type || event.detail.type === 'hero') {
        loadHeroImage();
      }
    };

    window.addEventListener('rybeats-settings-updated', onSettingsUpdated);
    return () => window.removeEventListener('rybeats-settings-updated', onSettingsUpdated);
  }, [loadHeroImage]);

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
