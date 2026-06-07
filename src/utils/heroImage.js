import { supabase } from '../supabaseClient';

export function getHeroImageUrl() {
  const { data } = supabase.storage.from('hero-images').getPublicUrl('hero.jpg');
  if (!data?.publicUrl) return null;
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function fetchHeroImageUrl() {
  try {
    return getHeroImageUrl();
  } catch {
    return null;
  }
}
