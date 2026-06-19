import { useMemo, useState } from 'react';
import { useLikes } from '../utils/likesStorage';
import './FilterBar.css';

// ── BPM ranges ───────────────────────────────────────────────────────────────
const BPM_RANGES = [
  { label: 'All BPM', min: 0, max: Infinity },
  { label: '< 80',   min: 0,   max: 79 },
  { label: '80–99',  min: 80,  max: 99 },
  { label: '100–119',min: 100, max: 119 },
  { label: '120–139',min: 120, max: 139 },
  { label: '140+',   min: 140, max: Infinity },
];

// ── Genre/mood tags ──────────────────────────────────────────────────────────
// These are auto-detected from beat names + BPM until you add a genre column.
// You can later replace this with a real `genre` / `mood` field in Supabase.
const GENRE_TAGS = [
  'All',
  'Trap',
  'Boom Bap',
  'Drill',
  'Lo-Fi',
  'Dark',
  'Melodic',
];

// Heuristic: classify a beat by its name + BPM.
// Once you add a real genre field, replace this with: beat.genre === tag
function beatMatchesGenre(beat, tag) {
  if (tag === 'All') return true;
  const name = (beat.name || '').toLowerCase();
  const bpm  = Number(beat.bpm || 0);

  switch (tag) {
    case 'Trap':     return bpm >= 130 && bpm <= 170;
    case 'Boom Bap': return bpm >= 85  && bpm <= 105;
    case 'Drill':    return bpm >= 135 && bpm <= 150;
    case 'Lo-Fi':    return bpm >= 70  && bpm <= 95;
    case 'Dark':     return (
      name.includes('dark') || name.includes('night') ||
      name.includes('shadow') || name.includes('evil') ||
      name.includes('blood') || name.includes('cold') ||
      name.includes('void')
    );
    case 'Melodic':  return (
      name.includes('melody') || name.includes('melodic') ||
      name.includes('dream') || name.includes('vibe') ||
      name.includes('wave') || name.includes('feel')
    );
    default: return true;
  }
}

// ── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price-low',  label: 'Price ↑' },
  { value: 'price-high', label: 'Price ↓' },
  { value: 'bpm-low',    label: 'BPM ↑' },
  { value: 'bpm-high',   label: 'BPM ↓' },
];

// ── Unique keys derived from live beats ──────────────────────────────────────
function useUniqueKeys(beats) {
  return useMemo(() => {
    const keys = [...new Set(beats.map((b) => b.key).filter(Boolean))].sort();
    return ['All keys', ...keys];
  }, [beats]);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function FilterBar({
  beats = [],
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  activeGenre,
  setActiveGenre,
  bpmRange,
  setBpmRange,
  activeKey,
  setActiveKey,
  resultCount,
  totalCount,
  showLikedOnly,
  setShowLikedOnly,
}) {
  const [showKeyDropdown, setShowKeyDropdown] = useState(false);
  const keys = useUniqueKeys(beats);
  const likes = useLikes();
  const likedCount = likes.size;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    activeGenre !== 'All' ||
    bpmRange.label !== 'All BPM' ||
    activeKey !== 'All keys' ||
    showLikedOnly;

  const clearAll = () => {
    setSearchQuery('');
    setActiveGenre('All');
    setBpmRange(BPM_RANGES[0]);
    setActiveKey('All keys');
    setShowLikedOnly(false);
  };

  return (
    <div className="filterbar">
      {/* ── Row 1: search + sort ── */}
      <div className="filterbar__top">
        <div className="filterbar__search-wrap">
          <svg className="filterbar__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="filterbar__search"
            type="text"
            placeholder="Search beats…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search beats"
          />
          {searchQuery && (
            <button
              className="filterbar__search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filterbar__sort">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`filterbar__sort-btn${sortBy === opt.value ? ' filterbar__sort-btn--active' : ''}`}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 2: genre tags + BPM + key ── */}
      <div className="filterbar__tags-row">
        {/* Genre pills */}
        <div className="filterbar__genre-pills">
          {GENRE_TAGS.map((tag) => (
            <button
              key={tag}
              className={`filterbar__pill${activeGenre === tag ? ' filterbar__pill--active' : ''}`}
              onClick={() => setActiveGenre(tag)}
            >
              {tag}
            </button>
          ))}

          {/* Liked filter */}
          <button
            className={`filterbar__pill filterbar__pill--liked${showLikedOnly ? ' filterbar__pill--active' : ''}`}
            onClick={() => setShowLikedOnly(!showLikedOnly)}
            title="Show liked beats"
          >
            <svg viewBox="0 0 24 24" width="13" height="13"
              fill={showLikedOnly ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2.2"
              style={{ flexShrink: 0 }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Liked{likedCount > 0 && ` (${likedCount})`}
          </button>
        </div>

        <div className="filterbar__secondary">
          {/* BPM range pills */}
          <div className="filterbar__bpm">
            {BPM_RANGES.map((range) => (
              <button
                key={range.label}
                className={`filterbar__pill filterbar__pill--sm${bpmRange.label === range.label ? ' filterbar__pill--active' : ''}`}
                onClick={() => setBpmRange(range)}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Key selector */}
          <div className="filterbar__key-wrap">
            <button
              className={`filterbar__key-btn${activeKey !== 'All keys' ? ' filterbar__pill--active' : ''}`}
              onClick={() => setShowKeyDropdown((s) => !s)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
              {activeKey}
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style={{ opacity: 0.5 }}>
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
            {showKeyDropdown && (
              <div className="filterbar__key-dropdown">
                {keys.map((k) => (
                  <button
                    key={k}
                    className={`filterbar__key-option${activeKey === k ? ' filterbar__key-option--active' : ''}`}
                    onClick={() => { setActiveKey(k); setShowKeyDropdown(false); }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: result count + clear ── */}
      <div className="filterbar__meta">
        <span className="filterbar__count">
          {resultCount === totalCount
            ? `${totalCount} beat${totalCount !== 1 ? 's' : ''}`
            : `${resultCount} of ${totalCount} beats`}
        </span>
        {hasActiveFilters && (
          <button className="filterbar__clear" onClick={clearAll}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

// Export helpers so App.js can use them
export { BPM_RANGES, beatMatchesGenre };
