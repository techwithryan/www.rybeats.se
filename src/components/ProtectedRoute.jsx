import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import './ProtectedRoute.css';

export default function ProtectedRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Laddar...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLoginSuccess={setUser} />;
  }

  return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
}
