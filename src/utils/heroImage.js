import { supabase } from '../supabaseClient';

// Stable URL — no cache-bust — so browser cache works between visits
export function getHeroImageUrl() {
  const { data } = supabase.storage.from('hero-images').getPublicUrl('hero.jpg');
  if (!data?.publicUrl) return null;
  return data.publicUrl;
}

// Fresh URL — used right after an upload to bypass the CDN cache
export function getHeroImageUrlFresh() {
  const { data } = supabase.storage.from('hero-images').getPublicUrl('hero.jpg');
  if (!data?.publicUrl) return null;
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function fetchHeroImageUrl(fresh = false) {
  try {
    return fresh ? getHeroImageUrlFresh() : getHeroImageUrl();
  } catch {
    return null;
  }
}