// ═══════════════════════════════════════════════════════════════
// BlockNexus VR — Audio Engine
// Procedural sound synthesis + Speech narrator
// ═══════════════════════════════════════════════════════════════

import { xrStore } from '../xrStore';

let _ctx = null;
const initAudio = () => {
  if (!_ctx && typeof window !== 'undefined') {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx && _ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
};

// Helper to trigger VR haptic feedback on all available controllers
const _haptic = (intensity = 0.5, duration = 50) => {
  try {
    const session = xrStore.getState()?.session;
    if (!session) return;
    session.inputSources.forEach(source => {
      if (source.gamepad?.hapticActuators?.length > 0) {
        source.gamepad.hapticActuators[0].pulse(intensity, duration);
      }
    });
  } catch (e) { /* ignore */ }
};

function _tone(freq, type, dur, vol = 0.1) {
  initAudio();
  if (!_ctx) return;
  const o = _ctx.createOscillator();
  const g = _ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, _ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + dur);
  o.connect(g);
  g.connect(_ctx.destination);
  o.start();
  o.stop(_ctx.currentTime + dur);
}

function _sweep(startFreq, endFreq, type, dur, vol = 0.08) {
  initAudio();
  if (!_ctx) return;
  const o = _ctx.createOscillator();
  const g = _ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(startFreq, _ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(endFreq, _ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, _ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + dur);
  o.connect(g);
  g.connect(_ctx.destination);
  o.start();
  o.stop(_ctx.currentTime + dur);
}

export const playClick = () => {
  _tone(900, 'sine', 0.04, 0.05);
  _haptic(0.4, 20);
};

export const playSuccess = () => {
  _tone(440, 'sine', 0.12, 0.08);
  setTimeout(() => _tone(550, 'sine', 0.1, 0.08), 100);
  setTimeout(() => _tone(660, 'sine', 0.2, 0.08), 200);
  _haptic(0.6, 50);
  setTimeout(() => _haptic(0.8, 60), 100);
};

export const playError = () => {
  _tone(280, 'square', 0.15, 0.06);
  setTimeout(() => _tone(220, 'square', 0.25, 0.04), 120);
  _haptic(1.0, 150);
};

export const playMining = () => {
  _tone(80, 'sawtooth', 0.08, 0.03);
  _haptic(0.2, 80);
};

export const playLaser = () => {
  _sweep(2000, 200, 'sawtooth', 0.3, 0.04);
  _haptic(0.5, 100);
};

export const playUnlock = () => {
  _sweep(200, 800, 'sine', 0.3, 0.06);
  setTimeout(() => _tone(880, 'sine', 0.4, 0.05), 250);
  _haptic(0.3, 250);
  setTimeout(() => _haptic(1.0, 100), 250);
};

export const playTxSend = () => {
  _sweep(600, 1200, 'sine', 0.15, 0.04);
  _haptic(0.3, 50);
};

export const playTxArrive = () => {
  _tone(1200, 'sine', 0.08, 0.04);
  _haptic(0.5, 40);
};

export const playBlockMined = () => {
  _tone(330, 'sine', 0.15, 0.06);
  setTimeout(() => _tone(440, 'sine', 0.15, 0.06), 120);
  setTimeout(() => _tone(660, 'sine', 0.15, 0.06), 240);
  setTimeout(() => _tone(880, 'sine', 0.3, 0.06), 360);
  _haptic(0.4, 100);
  setTimeout(() => _haptic(0.6, 100), 120);
  setTimeout(() => _haptic(0.8, 100), 240);
  setTimeout(() => _haptic(1.0, 200), 360);
};

export const playChainBreak = () => {
  _tone(100, 'square', 0.4, 0.08);
  setTimeout(() => _sweep(400, 50, 'sawtooth', 0.3, 0.06), 100);
  _haptic(1.0, 300);
};

export const playTypeBeep = () => {
  _tone(2000 + Math.random() * 500, 'sine', 0.02, 0.015);
};

// ═══════════════════════════════════════════════════════════════
// AI NARRATOR — Web Speech API
// Автоматически читает объяснение при смене сцены
// ═══════════════════════════════════════════════════════════════

const NARRATOR_SCRIPTS = {
  1: `Сцена первая. Архитектура сети.
     Слева — Централизованная система. Все транзакции проходят через единый сервер.
     Нажмите на центральный сервер, чтобы отключить его — и вся сеть остановится.
     Справа — Блокчейн. Децентрализованная сеть из множества равноправных узлов.
     Отключите любой узел — сеть продолжит работать через альтернативные пути.
     Это и есть ключевое преимущество децентрализации.`,

  2: `Сцена вторая. Структура блока.
     Перед вами четыре блока в цепочке. Каждый блок содержит транзакцию,
     хеш текущего блока и хеш предыдущего блока.
     Нажмите кнопку "Corrupt Data" на любом блоке, чтобы изменить транзакцию.
     Вы увидите эффект лавины: все последующие блоки станут недействительными.
     Именно так работает иммутабельность блокчейна — изменить один блок означает
     сломать всю цепочку.`,

  3: `Сцена третья. Криптографические ключи.
     Перед вами три ключа. Только один из них является правильным приватным ключом.
     Выберите "Hacker Key" или "Random Key" — система выдаст ошибку доступа.
     Выберите "Private Key" — сейф откроется, транзакция будет одобрена.
     Асимметричная криптография на эллиптических кривых защищает каждую транзакцию
     в блокчейне. Публичный ключ доступен всем, приватный — только владельцу.`,

  4: `Сцена четвёртая. Механизмы консенсуса.
     Слева — Proof of Work, доказательство работы. Четыре майнинг-рига соревнуются
     в решении сложной математической задачи. Это требует огромных вычислительных мощностей
     и потребляет до полутора тысяч ватт энергии. Нажмите "Mine Block", чтобы увидеть процесс.
     Справа — Proof of Stake, доказательство доли. Валидатор выбирается случайно,
     с вероятностью, пропорциональной его ставке. Скорость — доли секунды,
     энергопотребление — всего полватта. В три тысячи раз эффективнее.`,
};

let _narratorUtterance = null;

export const playNarrator = (sceneId, { rate = 0.92, pitch = 1.05, volume = 0.9 } = {}) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Останавливаем предыдущее
  window.speechSynthesis.cancel();

  const text = NARRATOR_SCRIPTS[sceneId];
  if (!text) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ru-RU';
  utter.rate = rate;
  utter.pitch = pitch;
  utter.volume = volume;

  // Подбираем русский голос если доступен
  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const ru = voices.find(v => v.lang.startsWith('ru'));
    if (ru) utter.voice = ru;
    window.speechSynthesis.speak(utter);
  };

  // Голоса могут грузиться асинхронно
  if (window.speechSynthesis.getVoices().length > 0) {
    pickVoice();
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice, { once: true });
    window.speechSynthesis.speak(utter); // запасной вариант
  }

  _narratorUtterance = utter;
};

export const stopNarrator = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
