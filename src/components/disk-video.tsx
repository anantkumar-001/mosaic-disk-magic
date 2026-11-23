import { useEffect, useRef, useState } from 'react';
import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';

interface DiskVideoProps {
  version: string;
  onSwitchToInteractive?: () => void;
}

export function DiskVideo({ version, onSwitchToInteractive }: DiskVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * (videoRef.current.duration || 0);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="dm-window dm-video-window" tabIndex={0} aria-label="diskMon 4K video walkthrough">
      <div className="dm-titlebar">
        <div className="traffic-lights"><i /><i /><i /></div>
        <span className="dm-mono">diskMon v{version} — Walkthrough (4K 60fps)</span>
        <span className="preview-label">LIVE RECORDING</span>
      </div>

      <div className="dm-video-container" onClick={togglePlay}>
        <video
          ref={videoRef}
          src="/diskmon-walkthrough.mp4"
          poster="/diskmon-poster.jpg"
          playsInline
          autoPlay
          muted
          loop
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="dm-video-player"
        />

        {!isPlaying && (
          <div className="dm-video-overlay-play">
            <button type="button" className="dm-play-circle" onClick={togglePlay} aria-label="Play video">
              <Play size={28} />
            </button>
          </div>
        )}

        <div className="dm-video-controls" onClick={e => e.stopPropagation()}>
          <div className="dm-video-scrubber" onClick={handleSeek}>
            <div className="dm-video-track">
              <div className="dm-video-progress" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="dm-video-bar">
            <div className="dm-video-left">
              <button type="button" className="dm-ctrl-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button type="button" className="dm-ctrl-btn" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <span className="dm-time-display dm-mono">
                {fmt(currentTime)} / {fmt(duration || 31)}
              </span>
            </div>
            <div className="dm-video-right">
              {onSwitchToInteractive && (
                <button type="button" className="dm-interactive-btn" onClick={onSwitchToInteractive}>
                  Try Interactive Treemap
                </button>
              )}
              <button type="button" className="dm-ctrl-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
                <Maximize2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dm-footer">
        <span className="dm-shortcuts">
          <span><kbd>Space</kbd> play / pause</span>
          <span><kbd>M</kbd> mute</span>
          <span><kbd>F</kbd> fullscreen</span>
        </span>
        <span className="dm-muted">Native 60fps recording · Uncompressed 4K resolution · 100% read-only</span>
      </div>
    </div>
  );
}

