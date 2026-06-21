import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AddBeat from './AddBeat';
import { DEFAULT_THEME, loadTheme, saveTheme } from '../utils/theme';
import { fetchHeroImageUrl } from '../utils/heroImage';
import './AdminDashboard.css';

function notifySiteUpdated(type) {
  window.dispatchEvent(new CustomEvent('rybeats-settings-updated', { detail: { type } }));
}

// ── Small reusable components ─────────────────────────────────────────────────
function SectionHeader({ title, desc }) {
  return (
    <div className="ad-section-header">
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}

function ColorRow({ label, themeKey, value, onChange }) {
  return (
    <div className="ad-color-row">
      <label>{label}</label>
      <div className="ad-color-inputs">
        <input
          type="color"
          value={value}
          onChange={e => onChange(themeKey, e.target.value)}
          title={label}
        />
        <input
          type="text"
          className="ad-hex"
          value={value}
          onChange={e => {
            const v = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(themeKey, v);
          }}
          spellCheck={false}
          maxLength={7}
        />
      </div>
    </div>
  );
}

function SliderRow({ label, themeKey, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div className="ad-slider-row">
      <div className="ad-slider-label">
        <span>{label}</span>
        <span className="ad-slider-val">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(themeKey, step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
        className="ad-slider"
      />
      <div className="ad-slider-ends"><span>{min}{unit}</span><span>{max}{unit}</span></div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('beats');
  const [theme, setTheme]         = useState(DEFAULT_THEME);
  const [heroImage, setHeroImage] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage]     = useState({ text: '', ok: true });

  useEffect(() => {
    const saved = loadTheme();
    setTheme(saved);
    if (saved.logoUrl) setLogoPreview(saved.logoUrl);
    loadHeroImg();
  }, []);

  const showMsg = (text, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage({ text: '', ok: true }), 3500);
  };

  // ── Theme ─────────────────────────────────────────────────────────────────
  const handleTheme = (key, value) => {
    const next = saveTheme({ ...theme, [key]: value });
    setTheme(next);
    notifySiteUpdated('theme');
  };

  const handleResetTheme = () => {
    const reset = saveTheme(DEFAULT_THEME);
    setTheme(reset);
    setLogoPreview(null);
    showMsg('Theme reset to default.');
  };

  // ── Hero image ────────────────────────────────────────────────────────────
  const loadHeroImg = async () => {
    const url = await fetchHeroImageUrl();
    setHeroImage(url);
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    showMsg('Uploading hero image…');
    try {
      const { error } = await supabase.storage.from('hero-images').upload('hero.jpg', file, { upsert: true });
      if (error) { showMsg(`Upload failed: ${error.message}`, false); return; }
      const url = await fetchHeroImageUrl();
      setHeroImage(url);
      notifySiteUpdated('hero');
      showMsg('Hero image updated.');
    } catch (err) {
      showMsg(`Error: ${err.message}`, false);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteHero = async () => {
    if (!window.confirm('Remove hero image?')) return;
    setUploading(true);
    try {
      const { error } = await supabase.storage.from('hero-images').remove(['hero.jpg']);
      if (error) { showMsg(`Delete failed: ${error.message}`, false); return; }
      setHeroImage(null);
      notifySiteUpdated('hero');
      showMsg('Hero image removed.');
    } catch (err) {
      showMsg(`Error: ${err.message}`, false);
    } finally {
      setUploading(false);
    }
  };

  // ── Logo ──────────────────────────────────────────────────────────────────
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    showMsg('Uploading logo…');
    try {
      const { error } = await supabase.storage.from('hero-images').upload('logo.png', file, { upsert: true });
      if (error) { showMsg(`Upload failed: ${error.message}`, false); return; }
      const { data } = supabase.storage.from('hero-images').getPublicUrl('logo.png');
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setLogoPreview(url);
      const next = saveTheme({ ...theme, logoUrl: url });
      setTheme(next);
      notifySiteUpdated('logo');
      showMsg('Logo updated.');
    } catch (err) {
      showMsg(`Error: ${err.message}`, false);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteLogo = () => {
    const next = saveTheme({ ...theme, logoUrl: '' });
    setTheme(next);
    setLogoPreview(null);
    notifySiteUpdated('logo');
    showMsg('Logo removed — default text will show.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'beats',  label: 'Beats' },
    { id: 'colors', label: 'Colors' },
    { id: 'navbar', label: 'Navbar' },
    { id: 'type',   label: 'Typography' },
    { id: 'logo',   label: 'Logo' },
    { id: 'hero',   label: 'Hero Image' },
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>RyBeats Admin</h1>
        <div className="header-info">
          <span>{user.email}</span>
          <button type="button" onClick={handleLogout} className="logout-btn">Log out</button>
        </div>
      </header>

      <div className="admin-container">
        <nav className="admin-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              className={`nav-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin-content">

          {/* ── BEATS ── */}
          {activeTab === 'beats' && (
            <AddBeat onSuccess={() => showMsg('Beat added! Refresh the store to see it.')} />
          )}

          {/* ── COLORS ── */}
          {activeTab === 'colors' && (
            <div className="ad-panel">
              <SectionHeader title="Colors" desc="Changes apply instantly across the entire site." />
              <div className="ad-rows">
                <ColorRow label="Background"            themeKey="bgColor"       value={theme.bgColor}       onChange={handleTheme} />
                <ColorRow label="Accent (buttons, tags)"themeKey="primaryColor"  value={theme.primaryColor}  onChange={handleTheme} />
                <ColorRow label="Primary text"          themeKey="textColor"     value={theme.textColor}     onChange={handleTheme} />
              </div>
              <div className="ad-preview" style={{ background: theme.bgColor, borderColor: theme.primaryColor }}>
                <p style={{ color: theme.textColor, margin: 0, fontSize: 14 }}>Preview text</p>
                <button style={{ background: theme.primaryColor, color: theme.bgColor, border: 'none', padding: '6px 16px', borderRadius: 6, fontWeight: 600, marginTop: 8 }}>
                  Sample button
                </button>
              </div>
              <button type="button" className="ad-reset-btn" onClick={handleResetTheme}>Reset all to default</button>
              {message.text && <p className={`ad-msg${message.ok ? '' : ' ad-msg--err'}`}>{message.text}</p>}
            </div>
          )}

          {/* ── NAVBAR ── */}
          {activeTab === 'navbar' && (
            <div className="ad-panel">
              <SectionHeader title="Navbar" desc="Control the navigation bar appearance." />
              <div className="ad-rows">
                <ColorRow label="Navbar background color" themeKey="navbarBg" value={theme.navbarBg || theme.bgColor} onChange={handleTheme} />
                <SliderRow label="Opacity" themeKey="navbarOpacity" value={theme.navbarOpacity ?? 0.92} min={0} max={1} step={0.01} unit="" onChange={handleTheme} />
              </div>
              <div className="ad-toggle-row">
                <span>Backdrop blur (glass effect)</span>
                <label className="ad-toggle">
                  <input type="checkbox" checked={theme.navbarBlur ?? true} onChange={e => handleTheme('navbarBlur', e.target.checked)} />
                  <span className="ad-toggle-track" />
                </label>
              </div>
              <div className="ad-navbar-preview" style={{
                background: `rgba(0,0,0,${theme.navbarOpacity ?? 0.92})`,
                backdropFilter: (theme.navbarBlur ?? true) ? 'blur(18px)' : 'none',
                padding: '12px 24px',
                borderRadius: 8,
                marginTop: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <span style={{ color: theme.textColor, fontWeight: 700, fontSize: 15 }}>RyBeats</span>
                <span style={{ color: theme.primaryColor, fontSize: 13 }}>Store · About · Admin</span>
              </div>
              {message.text && <p className={`ad-msg${message.ok ? '' : ' ad-msg--err'}`}>{message.text}</p>}
            </div>
          )}

          {/* ── TYPOGRAPHY ── */}
          {activeTab === 'type' && (
            <div className="ad-panel">
              <SectionHeader title="Typography" desc="Adjust font sizes across the site." />
              <div className="ad-rows">
                <SliderRow label="Body text size"  themeKey="fontSizeBase"    value={theme.fontSizeBase    || 16} min={12} max={20} unit="px" onChange={handleTheme} />
                <SliderRow label="Heading (H1) size" themeKey="fontSizeHeading" value={theme.fontSizeHeading || 48} min={28} max={80} unit="px" onChange={handleTheme} />
              </div>
              <div className="ad-type-preview" style={{ background: theme.bgColor, padding: 24, borderRadius: 8, marginTop: 20 }}>
                <h1 style={{ color: theme.textColor, fontSize: theme.fontSizeHeading || 48, margin: '0 0 12px', lineHeight: 1.05 }}>
                  Premium HipHop
                </h1>
                <p style={{ color: theme.textColor, fontSize: theme.fontSizeBase || 16, opacity: 0.8, margin: 0 }}>
                  Release-ready beats engineered for artists who want a modern, high-end sound.
                </p>
              </div>
              {message.text && <p className={`ad-msg${message.ok ? '' : ' ad-msg--err'}`}>{message.text}</p>}
            </div>
          )}

          {/* ── LOGO ── */}
          {activeTab === 'logo' && (
            <div className="ad-panel">
              <SectionHeader title="Logo" desc="Upload a custom logo for the navbar. Recommended: PNG with transparent background, min 200px wide." />
              <div className="ad-upload-area">
                <input type="file" accept="image/png,image/svg+xml,image/webp" id="logo-input" onChange={handleLogoUpload} disabled={uploading} />
                <label htmlFor="logo-input" className="ad-upload-btn">
                  {uploading ? 'Uploading…' : 'Choose logo file'}
                </label>
              </div>
              {logoPreview && (
                <div className="ad-logo-preview">
                  <div className="ad-logo-preview-bg">
                    <img src={logoPreview} alt="Logo preview" />
                  </div>
                  <button type="button" className="ad-delete-btn" onClick={handleDeleteLogo}>Remove logo</button>
                </div>
              )}
              {!logoPreview && (
                <p className="ad-empty-note">No custom logo — navbar shows default text.</p>
              )}
              {message.text && <p className={`ad-msg${message.ok ? '' : ' ad-msg--err'}`}>{message.text}</p>}
            </div>
          )}

          {/* ── HERO IMAGE ── */}
          {activeTab === 'hero' && (
            <div className="ad-panel">
              <SectionHeader title="Hero Image" desc="Background image for the home page. Best results: landscape, min 1920×1080px, JPG." />
              <div className="ad-upload-area">
                <input type="file" accept="image/*" id="hero-input" onChange={handleHeroUpload} disabled={uploading} />
                <label htmlFor="hero-input" className="ad-upload-btn">
                  {uploading ? 'Uploading…' : 'Choose hero image'}
                </label>
              </div>
              {heroImage && (
                <div className="ad-hero-preview">
                  <img src={heroImage} alt="Hero preview" />
                  <button type="button" className="ad-delete-btn" onClick={handleDeleteHero} disabled={uploading}>
                    Remove image
                  </button>
                </div>
              )}
              {!heroImage && <p className="ad-empty-note">No hero image — gradient fallback will show.</p>}
              {message.text && <p className={`ad-msg${message.ok ? '' : ' ad-msg--err'}`}>{message.text}</p>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
