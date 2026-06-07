import { useState, useRef, useEffect } from 'react';
import './MusicPlayer.css';

export default function MusicPlayer({ beat, onClose, allBeats, onPlay, isMinimized, onToggleMinimize }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!beat || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = beat.file_url;
    audio.load();
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [beat]);

  if (!beat) return null;

  const currentIndex = allBeats.findIndex(b => b.id === beat.id);
  const nextBeat = currentIndex < allBeats.length - 1 ? allBeats[currentIndex + 1] : allBeats[0];
  const prevBeat = currentIndex > 0 ? allBeats[currentIndex - 1] : allBeats[allBeats.length - 1];

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleNextBeat = () => {
    onPlay(nextBeat);
  };

  const handlePrevBeat = () => {
    onPlay(prevBeat);
  };

  return (
    <div className={`music-player ${isMinimized ? 'minimized' : 'expanded'}`}>
      {isMinimized ? (
        // Minimized view
        <div className="player-minimized" onClick={() => onToggleMinimize()}>
          <div className="minimized-content">
            {beat.image_url && (
              <img src={beat.image_url} alt={beat.name} className="minimized-image" />
            )}
            <div className="minimized-info">
              <p className="minimized-name">{beat.name}</p>
              <p className="minimized-details">{beat.bpm} BPM • {beat.key}</p>
            </div>
            <button className="minimized-toggle">▲</button>
          </div>
          <div className="minimized-progress" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
        </div>
      ) : (
        // Expanded view
        <div className="player-content">
          <div className="player-header">
            <div className="player-info">
              {beat.image_url && (
                <img 
                  src={beat.image_url} 
                  alt={beat.name}
                  className="player-image"
                />
              )}
              <div className="player-text">
                <h4>{beat.name}</h4>
                <p>{beat.bpm} BPM • {beat.key}</p>
              </div>
            </div>
            <button className="minimize-btn" onClick={() => onToggleMinimize()}>▼</button>
          </div>

          <div className="player-progress">
            <span>{formatTime(currentTime)}</span>
            <div 
              className="progress-bar"
              onClick={handleSeek}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseMove={(e) => {
                if (isDragging) handleSeek(e);
              }}
            >
              <div 
                className="progress-fill"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="player-controls">
            <button 
              className="control-btn"
              onClick={handlePrevBeat}
            >
              ⏮
            </button>
            <button
              className="play-btn"
              onClick={togglePlay}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button 
              className="control-btn"
              onClick={handleNextBeat}
            >
              ⏭
            </button>
          </div>
        </div>
      )}

      <audio 
        ref={audioRef} 
        src={beat.file_url} 
        onEnded={() => {
          // Auto-play next beat - loop back to first if at end
          handleNextBeat();
        }}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
      />
    </div>
  );
}