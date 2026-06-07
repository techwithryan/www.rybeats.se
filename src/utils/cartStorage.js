const CART_KEY = 'rybeats-cart';

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export function mergeCartWithCatalog(cart, beats) {
  if (!beats?.length) return cart;

  const catalog = new Map(beats.map((beat) => [String(beat.id), beat]));

  return cart
    .filter((item) => catalog.has(String(item.id)))
    .map((item) => {
      const beat = catalog.get(String(item.id));
      return {
        ...beat,
        cart_item_id: String(beat.id),
        license_type: 'commercial',
        price: Number(beat.price || 0),
      };
    });
}

export function formatSEK(amount) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}
