// likesStorage.js
// FIX: All imports must be at the top of the file

import { useState, useEffect, useCallback } from 'react';

const LIKES_KEY = 'rybeats-likes';
const LIKES_EVENT = 'rybeats-likes-changed';

// ── Read ──────────────────────────────────────────────────────────────────────
export function loadLikes() {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────
function saveLikes(set) {
  localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
  window.dispatchEvent(new CustomEvent(LIKES_EVENT, { detail: set }));
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function toggleLike(beatId) {
  const id = String(beatId);
  const likes = loadLikes();
  if (likes.has(id)) {
    likes.delete(id);
  } else {
    likes.add(id);
  }
  saveLikes(likes);
  return likes;
}

export function isLiked(beatId) {
  return loadLikes().has(String(beatId));
}

// ── Hook: single beat ─────────────────────────────────────────────────────────
// Usage: const { liked, toggle } = useLike(beat.id)
export function useLike(beatId) {
  const id = String(beatId);
  const [liked, setLiked] = useState(() => loadLikes().has(id));

  useEffect(() => {
    const handler = (e) => setLiked(e.detail.has(id));
    window.addEventListener(LIKES_EVENT, handler);
    return () => window.removeEventListener(LIKES_EVENT, handler);
  }, [id]);

  const toggle = useCallback(
    (e) => {
      e?.stopPropagation();
      const updated = toggleLike(id);
      setLiked(updated.has(id));
    },
    [id]
  );

  return { liked, toggle };
}

// ── Hook: full set (used in FilterBar / App) ──────────────────────────────────
export function useLikes() {
  const [likes, setLikes] = useState(() => loadLikes());

  useEffect(() => {
    const handler = (e) => setLikes(new Set(e.detail));
    window.addEventListener(LIKES_EVENT, handler);
    return () => window.removeEventListener(LIKES_EVENT, handler);
  }, []);

  return likes; // Set<string>
}