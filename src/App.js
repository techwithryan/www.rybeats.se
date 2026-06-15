import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import AddBeat from './components/AddBeat';
import MusicPlayer from './components/MusicPlayer';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Hero from './components/Hero';
import Checkout from './components/Checkout';
import BeatRow from './components/BeatRow';
import SuccessModal from './components/SuccessModal';
import EmailSubscribe from './components/EmailSubscribe';
import { loadCart, saveCart, clearCart, mergeCartWithCatalog, formatSEK } from './utils/cartStorage';
import { applyTheme, loadTheme } from './utils/theme';

import './App.css';

function App() {
  const [beats, setBeats] = useState([]);
  const [cart, setCart] = useState(() => loadCart());
  const [nowPlaying, setNowPlaying] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [successSessionId, setSuccessSessionId] = useState(null);

  // Check for Stripe redirect query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      setSuccessSessionId(sessionId);
      setCart([]);
      clearCart();

      // Clean up URL query parameters so refreshing doesn't show modal again
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (paymentStatus === 'cancel') {
      alert('Payment cancelled. You can continue shopping.');
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [maxPrice, setMaxPrice] = useState('');
  const [beatsLoading, setBeatsLoading] = useState(true);
  const [beatsError, setBeatsError] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('rybeats-page') || 'home';
  });

  useEffect(() => {
    localStorage.setItem('rybeats-page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    applyTheme(loadTheme());
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    if (beats.length === 0) return;
    setCart((prev) => mergeCartWithCatalog(prev, beats));
  }, [beats]);

  useEffect(() => {
    document.body.classList.toggle('has-music-player', Boolean(nowPlaying));
    return () => document.body.classList.remove('has-music-player');
  }, [nowPlaying]);

  // Check authentication ONCE on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
      } catch (err) {
        console.log('Auth check failed:', err);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // Fetch beats
  useEffect(() => {
    fetchBeats();
  }, []);

  async function fetchBeats() {
    setBeatsLoading(true);
    setBeatsError('');
    const { data, error } = await supabase
      .from('beats')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.log('Error:', error);
      setBeatsError('Could not load beats. Please try again.');
    } else {
      setBeats(data || []);
    }
    setBeatsLoading(false);
  }

  function addToCart(beat) {
    setCart((prevCart) => {
      const cartItemId = String(beat.id);
      if (prevCart.some((item) => item.cart_item_id === cartItemId)) {
        return prevCart;
      }
      return [
        ...prevCart,
        {
          ...beat,
          cart_item_id: cartItemId,
          license_type: 'commercial',
          price: Number(beat.price || 0),
        }
      ];
    });
    setCartDrawerOpen(true);
  }

  function removeFromCart(cartItemId) {
    setCart((prevCart) => prevCart.filter((item) => item.cart_item_id !== cartItemId));
  }

  const filteredBeats = beats
    .filter((beat) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        beat.name?.toLowerCase().includes(query) ||
        beat.key?.toLowerCase().includes(query) ||
        String(beat.bpm || '').includes(query);
      const matchesPrice =
        maxPrice === '' || Number(beat.price || 0) <= Number(maxPrice);
      return matchesQuery && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'bpm-low') return Number(a.bpm || 0) - Number(b.bpm || 0);
      if (sortBy === 'bpm-high') return Number(b.bpm || 0) - Number(a.bpm || 0);
      return Number(b.id || 0) - Number(a.id || 0);
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="App">
        {currentPage === 'home' && <Hero onNavigate={setCurrentPage} />}

        {currentPage === 'store' && (
          <>
            {!authLoading && user ? <AddBeat onSuccess={fetchBeats} /> : null}

            <section className="store-section">
              <div className="store-heading-row">
                <h2>Available Beats</h2>
                <button
                  onClick={() => {
                    if (cart.length === 0) {
                      alert('Cart is empty!');
                      return;
                    }
                    setCartDrawerOpen((prev) => !prev);
                  }}
                  className="cart-open-btn"
                >
                  🛒 Cart ({cart.length})
                </button>
              </div>

              <div className="store-toolbar">
                <input
                  type="text"
                  placeholder="Search beat name, key or BPM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="bpm-low">BPM: Low to High</option>
                  <option value="bpm-high">BPM: High to Low</option>
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Max price ($)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              <div className="beats-list">
                <div className="beat-list-header">
                  <span className="col-num">#</span>
                  <span className="col-thumb"></span>
                  <span className="col-title">Title</span>
                  <span className="col-license">License</span>
                  <span className="col-price">Price</span>
                  <span className="col-action"></span>
                </div>
                {filteredBeats.map((beat, index) => (
                  <BeatRow
                    key={beat.id}
                    beat={beat}
                    index={index}
                    onPlay={setNowPlaying}
                    onAddCart={addToCart}
                    onDelete={(id) => setBeats((prevBeats) => prevBeats.filter((b) => b.id !== id))}
                    isPlaying={nowPlaying?.id === beat.id}
                    currentBeat={nowPlaying}
                    canDelete={!authLoading && Boolean(user)}
                  />
                ))}
              </div>
              {beatsLoading && <p className="store-loading-state">Loading beats...</p>}
              {beatsError && (
                <div className="store-error-state">
                  <p>{beatsError}</p>
                  <button type="button" onClick={fetchBeats}>Retry</button>
                </div>
              )}
              {!beatsLoading && !beatsError && filteredBeats.length === 0 && (
                <p className="store-empty-state">No beats found for this filter combo.</p>
              )}
            </section>
          </>
        )}

        {currentPage === 'about' && (
          <section className="content-section">
            <h2>About RyBeats</h2>
            <p className="content-section-text">
              Welcome to RyBeats. The source of premium hip hop, trap & pop beats.
              Feel free to send me a straight DM with any type of special requests.

              Much welcome to join in on the
              <a href='https://discord.gg/EfbQFF4qNc'> discord server </a>

              Godbless, Ryan.
            </p>
          </section>
        )}

        {currentPage === 'media' && (
          <section className="content-section media-section">
            <h2>Media & Contact</h2>
            <p className="content-section-text">
              Follow RyBeats for new releases, or reach out for collaborations and custom production.
            </p>
            <div className="media-links">
              <a
                href="https://open.spotify.com/artist/5tS4sV7dbDsRzUAWEefXkS"
                target="_blank"
                rel="noopener noreferrer"
              >
                Spotify
              </a>
              <a
                href="https://www.youtube.com/@rybeatsofficial"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube
              </a>
              <a href="https://discord.gg/EfbQFF4qNc" target="_blank" rel="noopener noreferrer">
                Discord
              </a>
              <a href="mailto:ryan.cornelio@gmail.com">ryan.cornelio@gmail.com</a>
            </div>
          </section>
        )}

        {currentPage === 'admin' && <ProtectedRoute />}
      </div>

      <MusicPlayer
        beat={nowPlaying}
        onClose={() => setNowPlaying(null)}
        allBeats={beats}
        onPlay={setNowPlaying}
        isMinimized={isPlayerMinimized}
        onToggleMinimize={() => setIsPlayerMinimized(!isPlayerMinimized)}
      />

      {showCheckout && (
        <Checkout
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onRemoveItem={removeFromCart}
        />
      )}

      {successSessionId && (
        <SuccessModal
          sessionId={successSessionId}
          onClose={() => setSuccessSessionId(null)}
        />
      )}

      {currentPage === 'store' && (
        <aside className={`mini-cart-drawer ${cartDrawerOpen ? 'open' : ''}`}>
          <div className="mini-cart-header">
            <h3>Your Cart</h3>
            <button type="button" onClick={() => setCartDrawerOpen(false)}>✕</button>
          </div>
          {cart.length === 0 ? (
            <p className="mini-cart-empty">No beats yet. Add a beat to get commercial rights.</p>
          ) : (
            <>
              <div className="mini-cart-items">
                {cart.map((item) => (
                  <div key={item.cart_item_id} className="mini-cart-item">
                    <div>
                      <p>{item.name}</p>
                      <span>Commercial rights</span>
                    </div>
                    <div className="mini-cart-item-right">
                      <strong>{formatSEK(item.price)}</strong>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cart_item_id)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mini-cart-footer">
                <p>
                  Total
                  <strong>
                    {formatSEK(cart.reduce((sum, item) => sum + Number(item.price || 0), 0))}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckout(true);
                    setCartDrawerOpen(false);
                  }}
                >
                  Checkout
                </button>
              </div>
            </>
          )}
        </aside>
      )}

      <EmailSubscribe />

      <Footer />
    </div>
  );
}

export default App;