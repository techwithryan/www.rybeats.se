const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase server configuration');
  }
  return createClient(url, key);
}

module.exports = { getSupabase };
