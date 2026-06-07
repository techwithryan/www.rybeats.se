import { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar({ currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'Store', id: 'store' },
    { name: 'About', id: 'about' },
    { name: 'Media', id: 'media' },
    { name: 'Admin', id: 'admin', isAdmin: true },
  ];

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', mobileMenuOpen);
    return () => document.body.classList.remove('mobile-menu-open');
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navigate = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <img
            src="/RyBeatsLogo.png"
            alt="RyBeats Logo"
            className="navbar-logo"
            onClick={() => navigate('home')}
          />

          <div className="navbar-links">
            {navItems.map((item) =>
              item.isAdmin ? (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className="navbar-admin-btn"
                >
                  {item.name}
                </button>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`navbar-link ${currentPage === item.id ? 'active' : ''}`}
                >
                  {item.name}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="mobile-menu-btn"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      <div
        className={`mobile-menu-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      <aside
        className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        {navItems.map((item) =>
          item.isAdmin ? (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className="mobile-admin-btn"
            >
              {item.name}
            </button>
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`mobile-link ${currentPage === item.id ? 'active' : ''}`}
            >
              {item.name}
            </button>
          )
        )}
      </aside>
    </>
  );
}
