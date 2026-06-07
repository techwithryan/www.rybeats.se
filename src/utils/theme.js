export const DEFAULT_THEME = {
  bgColor: '#0c0b09',
  primaryColor: '#d4a853',
  textColor: '#f0ece4',
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex) {
  const raw = hex.replace('#', '');
  const value =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.slice(0, 6);
  const num = parseInt(value, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function mix(hexA, hexB, weightB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA;
  const w = clamp(weightB, 0, 1);
  return rgbToHex(
    a.r + (b.r - a.r) * w,
    a.g + (b.g - a.g) * w,
    a.b + (b.b - a.b) * w
  );
}

function lighten(hex, amount) {
  return mix(hex, '#ffffff', amount / 100);
}

export function normalizeTheme(theme) {
  return {
    bgColor: theme?.bgColor || DEFAULT_THEME.bgColor,
    primaryColor: theme?.primaryColor || DEFAULT_THEME.primaryColor,
    textColor: theme?.textColor || DEFAULT_THEME.textColor,
  };
}

export function applyTheme(themeInput) {
  const theme = normalizeTheme(themeInput);
  const root = document.documentElement;

  root.style.setProperty('--bg', theme.bgColor);
  root.style.setProperty('--surface', mix(theme.bgColor, '#ffffff', 0.06));
  root.style.setProperty('--surface-2', mix(theme.bgColor, '#ffffff', 0.1));
  root.style.setProperty('--ink-1', theme.textColor);
  root.style.setProperty('--ink-2', mix(theme.textColor, theme.bgColor, 0.45));
  root.style.setProperty('--ink-3', mix(theme.textColor, theme.bgColor, 0.72));
  root.style.setProperty('--ink-4', mix(theme.textColor, theme.bgColor, 0.88));
  root.style.setProperty('--accent', theme.primaryColor);
  root.style.setProperty('--accent-hi', lighten(theme.primaryColor, 12));
  root.style.setProperty('--accent-bg', `${theme.primaryColor}1a`);
  root.style.setProperty('--line', `${mix(theme.textColor, theme.bgColor, 0.85)}12`);

  // Legacy aliases used in older code paths
  root.style.setProperty('--bg-color', theme.bgColor);
  root.style.setProperty('--primary-color', theme.primaryColor);
  root.style.setProperty('--text-color', theme.textColor);
}

export function loadTheme() {
  try {
    const saved = localStorage.getItem('rybeats-theme');
    if (!saved) return DEFAULT_THEME;
    return normalizeTheme(JSON.parse(saved));
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme) {
  const normalized = normalizeTheme(theme);
  localStorage.setItem('rybeats-theme', JSON.stringify(normalized));
  applyTheme(normalized);
  window.dispatchEvent(new CustomEvent('rybeats-theme-updated', { detail: normalized }));
  return normalized;
}
