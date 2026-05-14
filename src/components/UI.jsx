import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClick } from '../utils/audio';

const SCENES = [
  { id: 1, icon: '🌐', label: 'СЕТЬ',      num: '01', color: '#0055ff' },
  { id: 2, icon: '⛓',  label: 'БЛОКИ',     num: '02', color: '#0055ff' },
  { id: 3, icon: '🔐', label: 'КЛЮЧИ',     num: '03', color: '#0055ff' },
  { id: 4, icon: '⚡', label: 'КОНСЕНСУС', num: '04', color: '#0055ff' },
];

const VR_TIPS = [
  'В VR: нажмите 🕹 левый триггер для телепортации',
  'В VR: посмотрите на левое запястье для управления сценами',
  'В VR: направьте луч и нажмите триггер для взаимодействия',
];

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const upd = () => setTime(new Date().toLocaleTimeString('ru-RU', { hour12: false }));
    upd();
    const iv = setInterval(upd, 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,0,0,0.5)', letterSpacing: 2 }}>
      {time}
    </span>
  );
}

function BlockCounter() {
  const [count, setCount] = useState(847293);
  useEffect(() => {
    const iv = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3)), 3000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,0,0,0.3)', letterSpacing: 1 }}>
      BLOCK <span style={{ color: 'rgba(0,0,0,0.8)' }}>#{count.toLocaleString()}</span>
    </div>
  );
}

function TxTicker() {
  const [txs, setTxs] = useState([]);
  const actions = ['Регистрация ТОО', 'Передача права', 'Оплата налога', 'Голосование', 'Выдача ЭЦП', 'Лицензия', 'Запрос справки'];
  const depts = ['МЦРИАП', 'МВД', 'МЮ', 'КГД', 'Акимат', 'E-GOV'];
  useEffect(() => {
    const make = () => {
      const act = actions[Math.floor(Math.random() * actions.length)];
      const dept = depts[Math.floor(Math.random() * depts.length)];
      const id = Math.floor(Math.random() * 9000 + 1000);
      setTxs(prev => [`${dept}: ${act} #${id}`, ...prev].slice(0, 4));
    };
    make();
    const iv = setInterval(make, 1900);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 140 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 7,
        color: 'rgba(0,0,0,0.4)', letterSpacing: 2,
        marginBottom: 2,
      }}>ОЖИДАЮЩИЕ ЗАПРОСЫ (MEMPOOL)</div>
      {txs.map((tx, i) => (
        <motion.div
          key={tx}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1 - i * 0.22, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            color: i === 0 ? '#111111' : 'rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          {tx}
        </motion.div>
      ))}
    </div>
  );
}

/* VR rotating hint at bottom */
function VRHint() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setIdx(i => (i + 1) % VR_TIPS.length), 5000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="vr-hint-badge">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
        >
          {VR_TIPS[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* Keyboard shortcut badge */
function KeyBadge({ k, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 7,
        background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 3, padding: '0 4px', color: 'rgba(0,0,0,0.5)',
      }}>{k}</span>
      <span style={{ color: 'rgba(0,0,0,0.4)', fontSize: 7 }}>{label}</span>
    </span>
  );
}

export default function UI({ currentScene, setCurrentScene, onEnterVR, narratorOn = true, onToggleNarrator }) {
  const go = useCallback((id) => {
    if (id === currentScene) return;
    setCurrentScene(id);
  }, [currentScene, setCurrentScene]);

  useEffect(() => {
    const handler = (e) => {
      const id = parseInt(e.key);
      if (id >= 1 && id <= 4) go(id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go]);

  const cur = SCENES.find(s => s.id === currentScene);

  return (
    <>
      {/* Corner brackets */}
      <div className="corner-tl" />
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="corner-br" />
      <div className="scan-overlay" />

      {/* ── TOP BAR ── */}
      <motion.div
        className="topbar glass clickable"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        {/* Brand */}
        <div className="brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <h1>BLOCKNEXUS</h1>
            <div style={{
              background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 4, padding: '1px 6px',
              fontFamily: 'var(--font-mono)', fontSize: 7,
              color: '#111111', letterSpacing: 2,
            }}>VR</div>
          </div>
          <p>BLOCKCHAIN SIMULATION ENGINE</p>
          <div className="status-live">LIVE NETWORK</div>
        </div>

        {/* Center Nav */}
        <nav className="nav">
          {SCENES.map(s => (
            <motion.button
              key={s.id}
              id={`scene-btn-${s.id}`}
              className={`scene-btn clickable ${currentScene === s.id ? 'active' : ''}`}
              onClick={() => go(s.id)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              style={{ borderColor: currentScene === s.id ? s.color + '88' : undefined }}
            >
              <span className="num">{s.num}</span>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              {s.label}
            </motion.button>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Progress pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {SCENES.map((s, i) => (
                <motion.div
                  key={s.id}
                  layout
                  style={{
                    width: currentScene === s.id ? 24 : 7,
                    height: 2, borderRadius: 2,
                    background: currentScene === s.id
                      ? s.color
                      : i < SCENES.findIndex(x => x.id === currentScene)
                        ? 'rgba(0,0,0,0.2)'
                        : 'rgba(0,0,0,0.05)',
                    boxShadow: currentScene === s.id ? `0 0 8px rgba(0,85,255,0.4)` : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => go(s.id)}
                  title={s.label}
                />
              ))}
            </div>

            {/* Narrator toggle */}
            <motion.button
              id="narrator-btn"
              title={narratorOn ? 'Выключить голос' : 'Включить голос'}
              className="narrator-btn clickable"
              onClick={onToggleNarrator}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              style={{
                background: narratorOn ? 'rgba(0,85,255,0.12)' : 'rgba(0,0,0,0.15)',
                border: `1px solid ${narratorOn ? 'rgba(0,85,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <span style={{
                display: 'inline-block',
                animation: narratorOn ? 'narratorPulse 1.4s ease infinite' : 'none',
              }}>🎙</span>
              <span style={{ fontSize: 9, letterSpacing: 1, color: narratorOn ? '#0055ff' : 'rgba(255,255,255,0.4)' }}>
                {narratorOn ? 'ON' : 'OFF'}
              </span>
            </motion.button>

            {/* VR button */}
            <motion.button
              id="enter-vr-btn"
              className="vr-btn clickable"
              onClick={onEnterVR}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
            >
              🥽 VR
            </motion.button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LiveClock />
            <BlockCounter />
          </div>
        </div>
      </motion.div>

      {/* ── SIDE DOTS ── */}
      <div className="side-panel">
        {SCENES.map(s => (
          <motion.div
            key={s.id}
            className={`side-dot clickable ${currentScene === s.id ? 'active' : ''}`}
            onClick={() => go(s.id)}
            title={s.label}
            style={{
              background: currentScene === s.id ? s.color : undefined,
              boxShadow: currentScene === s.id ? `0 0 10px ${s.color}, 0 0 20px ${s.color}55` : undefined,
            }}
          />
        ))}
      </div>

      {/* ── RIGHT MEMPOOL ── */}
      <div className="right-bar">
        <TxTicker />
      </div>

      {/* ── VR HINT (bottom center) ── */}
      <VRHint />

      {/* ── KEYBOARD SHORTCUT HINT (bottom right) ── */}
      <div style={{
        position: 'fixed', bottom: 10, right: 14,
        display: 'flex', gap: 10, alignItems: 'center',
        pointerEvents: 'none', userSelect: 'none',
      }}>
        <KeyBadge k="1-4" label="сцена" />
        <KeyBadge k="⊞" label="orbit" />
        <KeyBadge k="⟳" label="zoom" />
      </div>
    </>
  );
}
