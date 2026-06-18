import { useState, useRef, useEffect, useCallback } from 'react';
import './MusicPlayer.css';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const IconPause = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const IconPrev = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
);

const IconNext = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4V8l-5.5 4zM16 6h2v12h-2z" />
  </svg>
);

const IconShuffle = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
  </svg>
);

const IconRepeat = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
  </svg>
);

const IconRepeatOne = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v6H13z" />
  </svg>
);

const IconVolume = ({ level }) => {
  if (level === 0) return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
    </svg>
  );
  if (level < 0.5) return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
};

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </svg>
);

const IconChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z" />
  </svg>
);

// ── EQ Bars (playing animation) ──────────────────────────────────────────────
function EqBars() {
  return (
    <span className="mp-eq" aria-hidden="true">
      <span className="mp-eq__bar" />
      <span className="mp-eq__bar" />
      <span className="mp-eq__bar" />
      <span className="mp-eq__bar" />
    </span>
  );
}

// ── Format time ──────────────────────────────────────────────────────────────
function fmt(t) {
  if (!t || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function MusicPlayer({
  beat,
  onClose,
  allBeats,
  onPlay,
  isMinimized,
  onToggleMinimize,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none' | 'all' | 'one'
  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);

  // ── Load new beat ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!beat || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = beat.file_url;
    audio.volume = volume;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [beat]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (!beat) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 5);
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 5);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [beat, duration, currentTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation helpers ────────────────────────────────────────────────────
  const currentIndex = allBeats.findIndex((b) => b.id === beat?.id);

  const getNextBeat = useCallback(() => {
    if (!allBeats.length) return null;
    if (shuffle) {
      const others = allBeats.filter((b) => b.id !== beat?.id);
      return others[Math.floor(Math.random() * others.length)] || allBeats[0];
    }
    return currentIndex < allBeats.length - 1
      ? allBeats[currentIndex + 1]
      : allBeats[0];
  }, [allBeats, beat, currentIndex, shuffle]);

  const getPrevBeat = useCallback(() => {
    if (!allBeats.length) return null;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return null;
    }
    return currentIndex > 0
      ? allBeats[currentIndex - 1]
      : allBeats[allBeats.length - 1];
  }, [allBeats, currentIndex]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const next = getNextBeat();
    if (next) onPlay(next);
  };

  const handlePrev = () => {
    const prev = getPrevBeat();
    if (prev) onPlay(prev);
    // if null — currentTime was reset, nothing to do
  };

  const cycleRepeat = () => {
    setRepeatMode((m) => (m === 'none' ? 'all' : m === 'all' ? 'one' : 'none'));
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
    } else {
      const restore = prevVolume || 0.8;
      setVolume(restore);
      if (audioRef.current) audioRef.current.volume = restore;
    }
  };

  // ── Seek via progress bar ─────────────────────────────────────────────────
  const seekTo = (e, ref) => {
    if (!ref.current || !duration) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = x / rect.width;
    const newTime = pct * duration;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const setVolumeFromBar = (e) => {
    if (!volumeRef.current) return;
    const rect = volumeRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const v = x / rect.width;
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  // ── Mouse drag on progress bar ────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return;
    const move = (e) => seekTo(e, progressRef);
    const up = () => setIsDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [isDragging, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isVolumeDragging) return;
    const move = (e) => setVolumeFromBar(e);
    const up = () => setIsVolumeDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [isVolumeDragging]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audio event handlers ──────────────────────────────────────────────────
  const handleEnded = () => {
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }
    handleNext();
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  if (!beat) return null;

  // ── Minimized bar ─────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div className="mp mp--mini">
        <div
          className="mp__mini-progress"
          style={{ width: `${progressPct}%` }}
        />
        <div className="mp__mini-inner">
          {beat.image_url && (
            <img src={beat.image_url} alt={beat.name} className="mp__mini-thumb" />
          )}
          <div className="mp__mini-info">
            <span className="mp__mini-name">{beat.name}</span>
            <span className="mp__mini-meta">{beat.bpm} BPM · {beat.key}</span>
          </div>

          <div className="mp__mini-controls">
            <button className="mp__icon-btn" onClick={handlePrev} aria-label="Previous">
              <IconPrev />
            </button>
            <button className="mp__play-btn mp__play-btn--sm" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>
            <button className="mp__icon-btn" onClick={handleNext} aria-label="Next">
              <IconNext />
            </button>
          </div>

          <button
            className="mp__icon-btn mp__expand-btn"
            onClick={onToggleMinimize}
            aria-label="Expand player"
          >
            <IconChevronUp />
          </button>
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }}
          onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
    );
  }

  // ── Expanded player ───────────────────────────────────────────────────────
  return (
    <div className="mp mp--full">
      <div className="mp__inner">

        {/* Left: artwork + info */}
        <div className="mp__left">
          <div className="mp__artwork">
            {beat.image_url
              ? <img src={beat.image_url} alt={beat.name} />
              : <div className="mp__artwork-placeholder">♩</div>
            }
            {isPlaying && <div className="mp__artwork-eq"><EqBars /></div>}
          </div>
          <div className="mp__track-info">
            <span className="mp__track-name">{beat.name}</span>
            <span className="mp__track-meta">
              {beat.bpm && <span>{beat.bpm} BPM</span>}
              {beat.key && <span>{beat.key}</span>}
            </span>
          </div>
        </div>

        {/* Center: controls + progress */}
        <div className="mp__center">
          <div className="mp__controls">
            <button
              className={`mp__icon-btn mp__shuffle-btn${shuffle ? ' mp__icon-btn--active' : ''}`}
              onClick={() => setShuffle((s) => !s)}
              aria-label="Shuffle"
              title="Shuffle"
            >
              <IconShuffle />
            </button>

            <button className="mp__icon-btn" onClick={handlePrev} aria-label="Previous">
              <IconPrev />
            </button>

            <button
              className="mp__play-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <IconPause /> : <IconPlay />}
            </button>

            <button className="mp__icon-btn" onClick={handleNext} aria-label="Next">
              <IconNext />
            </button>

            <button
              className={`mp__icon-btn mp__repeat-btn${repeatMode !== 'none' ? ' mp__icon-btn--active' : ''}`}
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeatMode}`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <IconRepeatOne /> : <IconRepeat />}
              {repeatMode === 'one' && <span className="mp__repeat-dot" />}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mp__progress-row">
            <span className="mp__time">{fmt(currentTime)}</span>
            <div
              className="mp__progress"
              ref={progressRef}
              onClick={(e) => seekTo(e, progressRef)}
              onMouseDown={(e) => { setIsDragging(true); seekTo(e, progressRef); }}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={duration || 0}
              aria-valuenow={currentTime}
            >
              <div className="mp__progress-track">
                <div
                  className="mp__progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className="mp__progress-thumb"
                  style={{ left: `${progressPct}%` }}
                />
              </div>
            </div>
            <span className="mp__time">{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: volume + collapse */}
        <div className="mp__right">
          <button
            className="mp__icon-btn"
            onClick={toggleMute}
            aria-label="Toggle mute"
          >
            <IconVolume level={volume} />
          </button>
          <div
            className="mp__volume"
            ref={volumeRef}
            onClick={(e) => setVolumeFromBar(e)}
            onMouseDown={(e) => { setIsVolumeDragging(true); setVolumeFromBar(e); }}
          >
            <div className="mp__volume-track">
              <div
                className="mp__volume-fill"
                style={{ width: `${volume * 100}%` }}
              />
              <div
                className="mp__volume-thumb"
                style={{ left: `${volume * 100}%` }}
              />
            </div>
          </div>

          <button
            className="mp__icon-btn mp__collapse-btn"
            onClick={onToggleMinimize}
            aria-label="Minimize player"
          >
            <IconChevronDown />
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
