import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './AdminLogin.css';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('Fel epost eller lösenord');
        setLoading(false);
        return;
      }

      if (data.user) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError('Något gick fel. Försök igen.');
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-box">
        <h1>RyBeats Admin</h1>
        <p>Logga in för att hantera beats</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">E-post</label>
            <input
              id="email"
              type="email"
              placeholder="ryan.cornelio@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Lösenord</label>
            <input
              id="password"
              type="password"
              placeholder="Ditt lösenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>
      </div>
    </div>
  );
}
