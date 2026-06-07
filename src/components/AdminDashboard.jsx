import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AddBeat from './AddBeat';
import { DEFAULT_THEME, loadTheme, saveTheme } from '../utils/theme';
import { fetchHeroImageUrl } from '../utils/heroImage';
import './AdminDashboard.css';

function notifySiteUpdated(type) {
  window.dispatchEvent(new CustomEvent('rybeats-settings-updated', { detail: { type } }));
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('addbeat');
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [heroImage, setHeroImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = loadTheme();
    setTheme(saved);
    loadHeroImage();
  }, []);

  const handleThemeChange = (key, value) => {
    const newTheme = saveTheme({ ...theme, [key]: value });
    setTheme(newTheme);
    setMessage('Theme saved and applied.');
    setTimeout(() => setMessage(''), 3000);
  };

  const loadHeroImage = async () => {
    const url = await fetchHeroImageUrl();
    setHeroImage(url);
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage('Uploading hero image...');

    try {
      const { error } = await supabase.storage.from('hero-images').upload('hero.jpg', file, {
        upsert: true,
      });

      if (error) {
        setMessage(`Upload failed: ${error.message}`);
        return;
      }

      const url = await fetchHeroImageUrl();
      setHeroImage(url);
      notifySiteUpdated('hero');
      setMessage('Hero image updated.');
    } catch (err) {
      setMessage(`Something went wrong: ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(''), 4000);
      e.target.value = '';
    }
  };

  const handleDeleteHeroImage = async () => {
    if (!window.confirm('Remove the hero image?')) return;

    setUploading(true);
    setMessage('Removing hero image...');

    try {
      const { error } = await supabase.storage.from('hero-images').remove(['hero.jpg']);

      if (error) {
        setMessage(`Delete failed: ${error.message}`);
        return;
      }

      setHeroImage(null);
      notifySiteUpdated('hero');
      setMessage('Hero image removed.');
    } catch (err) {
      setMessage(`Something went wrong: ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleResetTheme = () => {
    const reset = saveTheme(DEFAULT_THEME);
    setTheme(reset);
    setMessage('Theme reset to default.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>RyBeats Admin Panel</h1>
        <div className="header-info">
          <span>{user.email}</span>
          <button type="button" onClick={handleLogout} className="logout-btn">
            Log out
          </button>
        </div>
      </header>

      <div className="admin-container">
        <nav className="admin-nav">
          <button
            type="button"
            className={`nav-btn ${activeTab === 'addbeat' ? 'active' : ''}`}
            onClick={() => setActiveTab('addbeat')}
          >
            Add Beat
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            Theme
          </button>
          <button
            type="button"
            className={`nav-btn ${activeTab === 'hero' ? 'active' : ''}`}
            onClick={() => setActiveTab('hero')}
          >
            Hero Image
          </button>
        </nav>

        <div className="admin-content">
          {activeTab === 'addbeat' && (
            <AddBeat
              onSuccess={() => {
                setMessage('Beat added. Refresh the store to see it.');
                setTimeout(() => setMessage(''), 4000);
              }}
            />
          )}

          {activeTab === 'theme' && (
            <div className="theme-customizer">
              <h2>Theme Settings</h2>
              <p>Colors apply instantly across the site and are saved for all visitors on this device.</p>

              <div className="color-settings">
                {[
                  { key: 'bgColor', label: 'Background' },
                  { key: 'primaryColor', label: 'Accent (buttons, links)' },
                  { key: 'textColor', label: 'Primary text' },
                ].map(({ key, label }) => (
                  <div className="color-group" key={key}>
                    <label htmlFor={key}>{label}</label>
                    <div className="color-input-wrapper">
                      <input
                        id={key}
                        type="color"
                        value={theme[key]}
                        onChange={(e) => handleThemeChange(key, e.target.value)}
                      />
                      <input
                        type="text"
                        className="color-hex-input"
                        value={theme[key]}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                            handleThemeChange(key, value);
                          }
                        }}
                        spellCheck={false}
                        aria-label={`${label} hex code`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="theme-preview">
                <h3>Preview</h3>
                <div
                  className="preview-box"
                  style={{
                    backgroundColor: theme.bgColor,
                    color: theme.textColor,
                    border: `2px solid ${theme.primaryColor}`,
                  }}
                >
                  <p>Sample storefront text</p>
                  <button
                    type="button"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.bgColor,
                    }}
                  >
                    Sample button
                  </button>
                </div>
              </div>

              <button type="button" className="theme-reset-btn" onClick={handleResetTheme}>
                Reset to default
              </button>

              {message && <p className="upload-message">{message}</p>}
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="hero-uploader">
              <h2>Hero Image</h2>
              <p>Upload the background image for the home page hero section.</p>

              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroUpload}
                  disabled={uploading}
                  id="hero-input"
                />
                <label htmlFor="hero-input" className="upload-label">
                  {uploading ? 'Uploading...' : 'Choose image'}
                </label>
              </div>

              {message && <p className="upload-message">{message}</p>}

              {heroImage && (
                <div className="hero-preview">
                  <h3>Current hero</h3>
                  <img src={heroImage} alt="Hero preview" />
                  <button
                    type="button"
                    onClick={handleDeleteHeroImage}
                    disabled={uploading}
                    className="hero-delete-btn"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
