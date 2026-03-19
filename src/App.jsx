import { useState, useRef, useCallback } from "react";
import sounds from "./sounds";

// ─── localStorage helpers ────────────────────────────────────────────────────

const LS_KEY = "soundboard-volumes";

function loadVolumes() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveVolumes(vols) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(vols));
  } catch {}
}

// ─── Audio manager ───────────────────────────────────────────────────────────

function useAudioManager() {
  const pool = useRef({});

  const getOrCreate = useCallback((file) => {
    if (!pool.current[file]) {
      const path = `${import.meta.env.BASE_URL}sounds/${file}`;
      pool.current[file] = new Audio(path);
    }
    return pool.current[file];
  }, []);

  const play = useCallback((file, volume) => {
    const audio = getOrCreate(file);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return audio;
  }, [getOrCreate]);

  const stop = useCallback((file) => {
    const audio = pool.current[file];
    if (audio) { audio.pause(); audio.currentTime = 0; }
  }, []);

  const stopAll = useCallback(() => {
    Object.values(pool.current).forEach((a) => { a.pause(); a.currentTime = 0; });
  }, []);

  const setVolume = useCallback((file, volume) => {
    const audio = pool.current[file];
    if (audio) audio.volume = Math.max(0, Math.min(1, volume));
  }, []);

  return { play, stop, stopAll, setVolume };
}

// ─── Volume Slider (stops click propagation so it doesn't trigger play) ──────

function VolumeKnob({ soundId, value, onChange, accent }) {
  const pct = Math.round(value * 100);
  const icon = value === 0 ? "🔇" : value < 0.4 ? "🔈" : value < 0.75 ? "🔉" : "🔊";

  return (
    <div className="vol-knob" style={{ "--accent": accent }}>
      <span className="vol-knob-icon">{icon}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        aria-label={`Volume for ${soundId}`}
        className="vol-knob-slider"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="vol-knob-pct">{pct}%</span>
    </div>
  );
}

// ─── Sound Button ────────────────────────────────────────────────────────────

function SoundButton({ sound, onPlay, onStop, onVolumeChange, isActive, volume }) {
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);
  const idRef = useRef(0);

  const addRipple = (e) => {
    const rect = btnRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const id = ++idRef.current;
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
  };

  const handleClick = (e) => {
    addRipple(e);
    if (isActive) {
      onStop(sound.file);
    } else {
      onPlay(sound.file, volume);
    }
  };

  return (
    <div
      className={`sound-card ${isActive ? "active" : ""}`}
      style={{ "--accent": sound.color }}
    >
      <button
        ref={btnRef}
        onClick={handleClick}
        className="sound-btn"
        aria-label={sound.label}
        aria-pressed={isActive}
      >
        {ripples.map((rp) => (
          <span key={rp.id} className="ripple" style={{ left: rp.x, top: rp.y }} />
        ))}
        <span className="btn-emoji">{sound.emoji}</span>
        <span className="btn-label">{sound.label}</span>
        {isActive && <span className="playing-dot" />}
      </button>

      <VolumeKnob
        soundId={sound.id}
        value={volume}
        onChange={onVolumeChange}
        accent={sound.color}
      />
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { play, stop, stopAll, setVolume: setAudioVolume } = useAudioManager();
  const [activeMap, setActiveMap] = useState({});
  const [volumes, setVolumes] = useState(() => {
    const saved = loadVolumes();
    // Default every sound to 1.0 if not previously set
    const defaults = {};
    sounds.forEach((s) => { defaults[s.id] = saved[s.id] ?? 1; });
    return defaults;
  });
  const [searchQuery, setSearchQuery] = useState("");

  const handlePlay = useCallback(
    (file, volume) => {
      const audio = play(file, volume);
      setActiveMap((m) => ({ ...m, [file]: true }));
      audio.onended = () => setActiveMap((m) => ({ ...m, [file]: false }));
    },
    [play]
  );

  const handleStop = useCallback(
    (file) => {
      stop(file);
      setActiveMap((m) => ({ ...m, [file]: false }));
    },
    [stop]
  );

  const handleStopAll = () => {
    stopAll();
    setActiveMap({});
  };

  const handleVolumeChange = useCallback(
    (sound, newVol) => {
      setVolumes((prev) => {
        const next = { ...prev, [sound.id]: newVol };
        saveVolumes(next);
        return next;
      });
      // Live-update if currently playing
      setAudioVolume(sound.file, newVol);
    },
    [setAudioVolume]
  );

  const filtered = sounds.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const anyActive = Object.values(activeMap).some(Boolean);

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="logo-mark">🎚️</div>
          <div>
            <h1 className="title">SOUNDBOARD</h1>
            <p className="subtitle">tap to play · tap again to stop</p>
          </div>
        </div>
      </header>

      {/* ── Controls ── */}
      <div className="controls">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            placeholder="Search sounds…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button
          className={`stop-all-btn ${anyActive ? "has-active" : ""}`}
          onClick={handleStopAll}
          disabled={!anyActive}
        >
          ⏹ Stop All
        </button>
      </div>

      {/* ── Grid ── */}
      <main className="grid">
        {filtered.length === 0 ? (
          <p className="empty-state">No sounds match "{searchQuery}"</p>
        ) : (
          filtered.map((s) => (
            <SoundButton
              key={s.id}
              sound={s}
              onPlay={handlePlay}
              onStop={handleStop}
              onVolumeChange={(v) => handleVolumeChange(s, v)}
              isActive={!!activeMap[s.file]}
              volume={volumes[s.id] ?? 1}
            />
          ))
        )}
      </main>

      <footer className="footer">
        {sounds.length} sound{sounds.length !== 1 ? "s" : ""} · edit{" "}
        <code>src/sounds.js</code> to customise · volumes saved automatically
      </footer>
    </div>
  );
}
