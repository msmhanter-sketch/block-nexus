import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Text, Float, Environment, ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { createXRStore, useXR, useXRInputSourceState, XR, XROrigin, TeleportTarget } from '@react-three/xr';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { AnimatePresence, motion } from 'framer-motion';
import { a, useSpring } from '@react-spring/three';

import { playClick, playTypeBeep, playNarrator, stopNarrator } from './utils/audio';
import UI from './components/UI';
import Scene1 from './components/Scene1';
import Scene2 from './components/Scene2';
import Scene3 from './components/Scene3';
import Scene4 from './components/Scene4';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: 'red', background: '#222', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

import { xrStore } from './xrStore';

/* ════ LUXURY STUDIO FLOOR ════ */
function StudioFloor({ inVR }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[400, 400]} />
      {inVR ? (
        <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.2} />
      ) : (
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={80}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050505"
          metalness={0.5}
        />
      )}
    </mesh>
  );
}

/* ════ SCENE TITLE ════ */
const sceneMeta = {
  1: { text: 'ДАТА-ЦЕНТР E-GOV vs GOVCHAIN', sub: 'Сравнение архитектур государственного управления', color: '#ffffff' },
  2: { text: 'ГОСУДАРСТВЕННЫЙ РЕЕСТР',        sub: 'Структура блока · Неизменяемость данных',           color: '#ffffff' },
  3: { text: 'ЗАЩИЩЕННЫЙ ДОСТУП',       sub: 'Аутентификация госслужащих и граждан',                   color: '#ffffff' },
  4: { text: 'ЭНЕРГОЭФФЕКТИВНЫЙ КОНСЕНСУС',     sub: 'Proof of Work vs Proof of Stake для Госсектора', color: '#ffffff' },
};

function SceneTitle({ sceneId }) {
  const grp  = useRef();
  const line = useRef();
  const meta = sceneMeta[sceneId] || sceneMeta[1];
  useFrame(({ clock }) => {
    if (grp.current) {
      grp.current.position.y = 14.0 + Math.sin(clock.elapsedTime * 0.42) * 0.3;
      grp.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.025;
    }
    if (line.current) line.current.material.opacity = 0.25 + Math.sin(clock.elapsedTime * 1.5) * 0.15;
  });
  return (
    <group ref={grp} position={[0, 14.0, -5]}>
      <mesh position={[0, 0, -0.15]}>
        <planeGeometry args={[24, 3.2]} />
        <meshBasicMaterial color={meta.color} transparent opacity={0.025} />
      </mesh>
      <mesh ref={line} position={[0, 0.9, -0.1]}>
        <planeGeometry args={[18, 0.012]} />
        <meshBasicMaterial color={meta.color} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, -0.9, -0.1]}>
        <planeGeometry args={[18, 0.012]} />
        <meshBasicMaterial color={meta.color} transparent opacity={0.2} />
      </mesh>
      <Text fontSize={1.4} color={meta.color} anchorX="center" anchorY="middle"
        letterSpacing={0.18} outlineWidth={0.009} outlineColor="#000">
        {meta.text}
      </Text>
      <Text position={[0, -1.3, 0]} fontSize={0.35} color={meta.color}
        anchorX="center" opacity={0.45} letterSpacing={0.1}>
        {meta.sub}
      </Text>
    </group>
  );
}

/* ════ HOLOGRAPHIC SUBTITLES (Typewriter Effect) ════ */
const sceneScripts = {
  1: 'Сцена 1: Сравнение архитектур.\nСлева: Дата-Центр E-GOV — централизованная система.\nОдин сервер, все операции через один узел. Отключите его — и система остановится.\nСправа: Сеть GovChain — децентрализованная система.\nМножество узлов (ЦОН, Акимат). Отключите один — сеть продолжит работу.',
  2: 'Сцена 2: Государственный Реестр.\nКаждый гос-блок содержит: запись, хэш и хэш предыдущего блока.\nСымитируйте взлом и измените данные — все последующие блоки станут недействительными.\nБлокчейн гарантирует неизменяемость государственных данных.',
  3: 'Сцена 3: Единый Архив Данных.\nВаш ИИН работает как Публичный ключ — он открыт для ведомств.\nВаша ЭЦП — это Приватный ключ, доступный только вам.\nВыберите ключ для авторизации.\nНеверная ЭЦП — отказ в доступе. Валидная ЭЦП — доступ к гос. услугам разрешен.',
  4: 'Сцена 4: Энергоэффективный Консенсус.\nProof of Work: сжигает миллионы тенге из госбюджета на электроэнергию.\nProof of Stake: основан на стейкинге узлов, расход почти нулевой.\nPoS экономит бюджет и рекомендован для национальных блокчейн-сетей.',
};

function HoloSubtitles({ sceneId, inVR }) {
  const fullText = sceneScripts[sceneId] || '';
  const [dispText, setDispText] = useState('');
  const textRef = useRef();

  useEffect(() => {
    let i = 0;
    const len = fullText.length;
    const interval = setInterval(() => {
      i++;
      if (i <= len) {
        setDispText(fullText.slice(0, i));
        if (i % 2 === 0 && fullText.charAt(i - 1) !== ' ') playTypeBeep();
      } else {
        clearInterval(interval);
      }
    }, 45); // typing speed
    return () => clearInterval(interval);
  }, [sceneId, fullText]);

  useFrame(({ camera }) => {
    if (textRef.current && inVR) {
      // HUD position: slightly down and 0.8m forward from the camera
      const offset = new THREE.Vector3(0, -0.2, -0.8);
      offset.applyQuaternion(camera.quaternion);
      textRef.current.position.copy(camera.position).add(offset);
      textRef.current.quaternion.copy(camera.quaternion);
    }
  });

  if (!inVR) return null;

  return (
    <group ref={textRef} scale={0.2}>
      {/* Glow backing */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[3.2, 0.45]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3.24, 0.49]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <Text
        fontSize={0.035}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        lineHeight={1.4}
        maxWidth={3.0}
      >
        {dispText}
      </Text>
    </group>
  );
}

/* ════ STARFIELD BACKGROUND ════ */
function Starfield() {
  const ref = useRef();
  const count = 800;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 200;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 200;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    return arr;
  }, []);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.008; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.18} color="#ffffff" transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

/* ════ SCENE FLASH TRANSITION ════ */
function SceneFlash({ trigger }) {
  const ref = useRef();
  const startRef = useRef(null);
  useEffect(() => { startRef.current = performance.now(); }, [trigger]);
  useFrame(() => {
    if (!ref.current || startRef.current === null) return;
    const t = (performance.now() - startRef.current) / 1000;
    ref.current.material.opacity = Math.max(0, 0.4 - t * 2);
    ref.current.visible = t < 0.5;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]} scale={500}>
      <sphereGeometry />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

/* ════ POST-PROCESSING ════ */
function PostFX({ inVR }) {
  if (inVR) return null;
  return (
    <EffectComposer>
      <Bloom
        intensity={0.2}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.1} darkness={0.55} />
    </EffectComposer>
  );
}

/* ════════════════════════════════════════
   VR SCENE SWITCHER — wrist panel in VR
   ════════════════════════════════════════ */
const SCENE_COLORS = { 1: '#ffffff', 2: '#ffffff', 3: '#ffffff', 4: '#ffffff' };

function VRSceneButton({ position, sceneId, label, icon, currentScene, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const isActive = currentScene === sceneId;
  const col = SCENE_COLORS[sceneId];
  const { emI, sc } = useSpring({
    emI: isActive ? 4 : hovered ? 2.2 : 0.6,
    sc:  isActive ? 1.1 : hovered ? 1.05 : 1,
    config: { tension: 200, friction: 18 },
  });

  return (
    <a.group position={position} scale={sc}
      onClick={e => { e.stopPropagation(); onSelect(sceneId); playClick(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Button body */}
      <mesh>
        <boxGeometry args={[0.22, 0.07, 0.015]} />
        <a.meshPhysicalMaterial
          color={isActive ? col : '#ffffff'}
          emissive={isActive ? col : '#ffffff'}
          emissiveIntensity={emI}
          metalness={0.1}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent opacity={isActive ? 1 : 0.85}
        />
      </mesh>
      {/* Border glow */}
      <mesh>
        <boxGeometry args={[0.225, 0.075, 0.012]} />
        <a.meshStandardMaterial color={isActive ? col : '#ffffff'} emissive={col} emissiveIntensity={emI * 0.5} wireframe transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <Text position={[0, 0, 0.009]} fontSize={0.025} color={isActive ? '#000' : '#fff'} anchorX="center" anchorY="middle">
        {icon} {label}
      </Text>
    </a.group>
  );
}

/* ════ VR LOCOMOTION (Pure WebXR API) ════ */

// VR Spawn is completely removed because the user stays at [0,0,0] and the scene moves!

function VRLocomotion({ originRef, currentScene, setCurrentScene }) {
  const { gl, camera } = useThree();
  const snapCooldown = useRef(false);
  const btnCooldown  = useRef(false);
  const SPEED = 12.0; // units/second (frame-rate independent via delta)
  const SNAP  = Math.PI / 4;
  const _wq   = useRef(new THREE.Quaternion());
  const _fwd  = useRef(new THREE.Vector3());
  const _rgt  = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!originRef.current) return;
    const session = gl.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
      if (!source.gamepad) continue;
      const axes = source.gamepad.axes;

      // ─── LEFT STICK: Camera-relative movement ───────────────────────
      if (source.handedness === 'left') {
        const ax = axes.length >= 4 ? axes[2] : (axes[0] || 0);
        const ay = axes.length >= 4 ? axes[3] : (axes[1] || 0);
        
        if (Math.abs(ax) > 0.1 || Math.abs(ay) > 0.1) {
          // Use the actual XR headset camera, not the default canvas camera
          const xrCam = gl.xr.getCamera();
          xrCam.getWorldDirection(_fwd.current);
          _fwd.current.y = 0;
          if (_fwd.current.lengthSq() > 0.001) _fwd.current.normalize();
          
          _rgt.current.crossVectors(_fwd.current, new THREE.Vector3(0, 1, 0)).normalize();
          
          originRef.current.position.addScaledVector(_fwd.current, -ay * SPEED * delta);
          originRef.current.position.addScaledVector(_rgt.current,  ax * SPEED * delta);
        }
      }

      // ─── RIGHT STICK: Snap Turn + Vertical Flight ───────────────────
      if (source.handedness === 'right') {
        const rx = axes.length >= 4 ? axes[2] : (axes[0] || 0);
        const ry = axes.length >= 4 ? axes[3] : (axes[1] || 0);
        
        if (Math.abs(ry) > 0.1) {
          originRef.current.position.y -= ry * SPEED * delta;
        }
        if (Math.abs(rx) > 0.6 && !snapCooldown.current) {
          originRef.current.rotation.y -= Math.sign(rx) * SNAP;
          snapCooldown.current = true;
          setTimeout(() => { snapCooldown.current = false; }, 350);
        } else if (Math.abs(rx) < 0.3) {
          snapCooldown.current = false;
        }
      }

      // ─── BUTTONS A/B: Scene Switch ──────────────────────────────────
      if (source.gamepad.buttons) {
        const btnA = source.gamepad.buttons[4]?.pressed;
        const btnB = source.gamepad.buttons[5]?.pressed;
        if ((btnA || btnB) && !btnCooldown.current) {
          btnCooldown.current = true;
          setTimeout(() => { btnCooldown.current = false; }, 500);
          if (btnA) setCurrentScene(currentScene > 1 ? currentScene - 1 : 4);
          else if (btnB) setCurrentScene(currentScene < 4 ? currentScene + 1 : 1);
        }
      }
    }
  });
  return null;
}

/* ════ VR FLOATING SCENE MENU (follows camera) ════ */
function VRFloatingMenu({ currentScene, setCurrentScene, inVR }) {
  const menuRef = useRef();
  const SCENES = [
    { id: 1, icon: '🌐', label: 'СЕТЬ',      col: '#0055ff' },
    { id: 2, icon: '⛓',  label: 'БЛОКИ',     col: '#0055ff' },
    { id: 3, icon: '🔐', label: 'КЛЮЧИ',     col: '#0055ff' },
    { id: 4, icon: '⚡', label: 'КОНСЕНСУС', col: '#0055ff' },
  ];

  // Scene description for HUD
  const sceneDesc = {
    1: 'ДАТА-ЦЕНТР E-GOV  vs  СЕТЬ GOVCHAIN',
    2: 'ГОСУДАРСТВЕННЫЙ РЕЕСТР (БЛОКЧЕЙН)',
    3: 'ЗАЩИЩЕННЫЙ ДОСТУП (КЛЮЧИ)',
    4: 'ЭНЕРГОЭФФЕКТИВНЫЙ КОНСЕНСУС',
  };

  useFrame(({ camera, gl }) => {
    if (!menuRef.current || !gl.xr.isPresenting) return;
    // Float 2.5m in front of camera at comfortable eye level
    const dist  = 2.5;
    const dir   = new THREE.Vector3(0, 0, -dist).applyQuaternion(camera.quaternion);
    const target = camera.position.clone().add(dir);
    
    // Smooth follow
    menuRef.current.position.lerp(target, 0.04);
    
    // Face the camera (billboard Y-axis only for stability)
    const flat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, Math.atan2(
        camera.position.x - menuRef.current.position.x,
        camera.position.z - menuRef.current.position.z
      ), 0)
    );
    menuRef.current.quaternion.slerp(flat, 0.04);
  });

  if (!inVR) return null;

  return (
    <group ref={menuRef} position={[0, 1.6, -2.5]}>
      {/* Backing plate */}
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[1.7, 0.52, 0.018]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.08} transparent opacity={0.92} />
      </mesh>
      {/* Neon border */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[1.72, 0.54, 0.014]} />
        <meshStandardMaterial color="#0055ff" emissive="#0055ff" emissiveIntensity={0.6} wireframe transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Top accent line */}
      <mesh position={[0, 0.26, -0.01]}><planeGeometry args={[1.66, 0.005]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.5} /></mesh>
      {/* Bottom accent line */}
      <mesh position={[0, -0.26, -0.01]}><planeGeometry args={[1.66, 0.003]} /><meshBasicMaterial color="#0055ff" transparent opacity={0.3} /></mesh>

      {/* Title + scene desc */}
      <Text position={[0, 0.205, 0]} fontSize={0.048} color="#111111" anchorX="center" letterSpacing={0.08}>
        BLOCKNEXUS VR
      </Text>
      <Text position={[0, 0.155, 0]} fontSize={0.022} color="#333333" anchorX="center" letterSpacing={0.04}>
        {sceneDesc[currentScene]}
      </Text>

      {/* 4 scene buttons */}
      {SCENES.map((s, i) => {
        const isAct = currentScene === s.id;
        return (
          <group key={s.id} position={[(i - 1.5) * 0.4, -0.04, 0]}
            onPointerDown={e => { e.stopPropagation(); setCurrentScene(s.id); playClick(); }}
          >
            <mesh>
              <boxGeometry args={[0.36, 0.22, 0.016]} />
              <meshStandardMaterial color={isAct ? '#111111' : '#f5f5f5'}
                emissive={isAct ? '#111111' : '#000000'}
                emissiveIntensity={isAct ? 0.5 : 0} metalness={0.8} roughness={0.2} transparent opacity={0.97} />
            </mesh>
            {/* Border glow for active */}
            {isAct && (
              <mesh>
                <boxGeometry args={[0.365, 0.225, 0.014]} />
                <meshBasicMaterial color="#0055ff" wireframe transparent opacity={0.35} depthWrite={false} />
              </mesh>
            )}
            <Text position={[0, 0.048, 0.01]} fontSize={0.036} color={isAct ? '#ffffff' : '#222222'} anchorX="center">{s.icon} {s.label}</Text>
            <Text position={[0, -0.042, 0.01]} fontSize={0.02} color={isAct ? '#aaaaaa' : '#888888'} anchorX="center">{`СЦЕНА 0${s.id}`}</Text>
            {/* Active underline */}
            {isAct && <mesh position={[0, -0.112, 0]}><planeGeometry args={[0.32, 0.004]} /><meshBasicMaterial color="#0055ff" transparent opacity={1} /></mesh>}
          </group>
        );
      })}

      {/* Controls hint */}
      <Text position={[0, -0.22, 0]} fontSize={0.022} color="#777777" anchorX="center">
        {'ЛЕВ.СТИК: движение  ·  ПРАВ.СТИК: поворот/высота  ·  A/B: сцены'}
      </Text>
    </group>
  );
}

/* ════ VR TELEPORT FLOOR REMOVED ════ */

/* ════ VR GROUND GRID — visible neon floor in VR ════ */
function VRGroundGrid({ inVR }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = 0.06 + Math.sin(clock.elapsedTime * 0.5) * 0.02;
  });
  if (!inVR) return null;
  return (
    <group position={[0, 0, 0]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[200, 200, 60, 60]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.04} depthWrite={false} />
      </mesh>
      {/* Glowing center cross */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.025, 200]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.15} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[200, 0.025]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.15} /></mesh>
    </group>
  );
}

/* ════ DESKTOP CONTROLS HELPER ════ */
const DESKTOP_CAMS = {
  // Scene1: two networks side-by-side, each ±8.5m, height ~8m — camera high & back
  1: { pos: [0, 5.0, 22.0], target: [0, 3.0, 0] },
  // Scene2: 4 pillars in arc, Z=-3 to -6, pillars at Y=3.5 center — front-center view
  2: { pos: [0, 5.0, 12.0], target: [0, 4.0, -4] },
  // Scene3: vault at Y=5, key cards at Z=4, Y=-0.5 — step back and slightly up
  3: { pos: [0, 4.0, 12.0], target: [0, 3.0, 2] },
  // Scene4: arena at Y=4.2, panels at ±5.5 — elevated wide shot
  4: { pos: [0, 12.0, 22.0], target: [0, 4.0, 0] },
};

const VR_CAMS = {
  // In VR the user stands at floor (Y=0), scenes unfold in front of them
  1: { pos: [0, 0, 14.0] }, // Net: stand between the two panels
  2: { pos: [0, 0, 6.0] },  // Blocks: stand inside the arc of pillars
  3: { pos: [0, 0, 10.0] }, // Keys: moved back — panel now at Z=5 in group, fits wider spread
  4: { pos: [0, 0, 14.0] }, // Arena: stand at edge, panels are at ±5.5 from center
};

function DesktopControls({ isIdle, currentScene, inVR }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const keysRef     = useRef({});

  const [animating, setAnimating] = useState(false);
  const destPos    = useRef(new THREE.Vector3());
  const destTarget = useRef(new THREE.Vector3());

  // Scene camera presets
  useEffect(() => {
    const d = DESKTOP_CAMS[currentScene];
    if (d) {
      destPos.current.set(...d.pos);
      destTarget.current.set(...d.target);
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 1800);
      return () => clearTimeout(t);
    }
  }, [currentScene]);

  // WASD keyboard listeners
  useEffect(() => {
    const down = (e) => { keysRef.current[e.code] = true; };
    const up   = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, []);

  const _fwd = useRef(new THREE.Vector3());
  const _rgt = useRef(new THREE.Vector3());
  const SPEED = 10; // units / second

  useFrame((_, delta) => {
    if (inVR || !controlsRef.current) return;

    const k = keysRef.current;
    const moving = k['KeyW'] || k['KeyS'] || k['KeyA'] || k['KeyD'] || k['KeyQ'] || k['KeyE'];

    if (moving) {
      // Foolproof camera-relative directions based directly on OrbitControls target
      _fwd.current.subVectors(controlsRef.current.target, camera.position);
      _fwd.current.y = 0;
      if (_fwd.current.lengthSq() > 0.001) _fwd.current.normalize();
      
      // Calculate right vector based on forward and UP
      _rgt.current.crossVectors(_fwd.current, new THREE.Vector3(0, 1, 0)).normalize();

      const offset = new THREE.Vector3();
      if (k['KeyW']) offset.addScaledVector(_fwd.current,  SPEED * delta);
      if (k['KeyS']) offset.addScaledVector(_fwd.current, -SPEED * delta);
      if (k['KeyA']) offset.addScaledVector(_rgt.current, -SPEED * delta);
      if (k['KeyD']) offset.addScaledVector(_rgt.current,  SPEED * delta);
      if (k['KeyQ']) offset.y -= SPEED * delta;
      if (k['KeyE']) offset.y += SPEED * delta;

      // Shift both camera and target by the exact offset to pan seamlessly
      camera.position.add(offset);
      controlsRef.current.target.add(offset);
      controlsRef.current.update();
    } else if (animating) {
      camera.position.lerp(destPos.current, 0.04);
      controlsRef.current.target.lerp(destTarget.current, 0.04);
      controlsRef.current.update();
    }
  });

  if (inVR) return null;
  return (
    <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.045}
      maxDistance={90} minDistance={2} maxPolarAngle={Math.PI * 0.88}
      rotateSpeed={0.55} zoomSpeed={0.75}
      autoRotate={isIdle && !animating} autoRotateSpeed={1.5}
    />
  );
}

/* ════ MAIN APP ════ */
function App() {
  const [currentScene, setCurrentScene] = useState(1);
  const [loaded, setLoaded]             = useState(false);
  const [loadPct, setLoadPct]           = useState(0);
  const [isIdle, setIsIdle]             = useState(false);
  const [narratorOn, setNarratorOn]     = useState(true);
  const [inVR, setInVR]                 = useState(false);
  
  const lastActionTime = useRef(Date.now());
  const vrOriginRef = useRef();

  // Reactively track VR session state
  useEffect(() => {
    return xrStore.subscribe((state) => {
      setInVR(!!state.session);
    });
  }, []);

  // Idle tracking for Booth Mode
  useEffect(() => {
    const reset = () => { lastActionTime.current = Date.now(); setIsIdle(false); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('click', reset);
    window.addEventListener('keydown', reset);
    
    const iv = setInterval(() => {
      if (Date.now() - lastActionTime.current > 15000 && !isIdle) setIsIdle(true);
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('click', reset);
      window.removeEventListener('keydown', reset);
      clearInterval(iv);
    };
  }, [isIdle]);

  // VR Camera Positional Snapping
  useEffect(() => {
    if (inVR && vrOriginRef.current) {
      const v = VR_CAMS[currentScene];
      if (v) {
        // Делаем мгновенный snap позиции (без lerp), чтобы не было укачивания,
        // это идеально совпадает со вспышкой SceneFlash
        setTimeout(() => {
          if (vrOriginRef.current) vrOriginRef.current.position.set(...v.pos);
        }, 50);
      }
    }
  }, [currentScene, inVR]);

  useEffect(() => {
    const steps = [8, 22, 38, 55, 70, 84, 95, 100];
    let i = 0;
    const iv = setInterval(() => {
      if (i < steps.length) { setLoadPct(steps[i]); i++; } else clearInterval(iv);
    }, 220);
    const t = setTimeout(() => setLoaded(true), 2200);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, []);

  const handleSceneChange = useCallback((id) => {
    if (id === currentScene) return;
    playClick();
    setCurrentScene(id);
    // Small delay so the scene renders before narration starts
    if (narratorOn) setTimeout(() => playNarrator(id), 800);
    else stopNarrator();
  }, [currentScene, narratorOn]);

  // Play narrator on initial load
  useEffect(() => {
    if (loaded && narratorOn) setTimeout(() => playNarrator(1), 1200);
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* ── SPLASH ── */}
      <AnimatePresence>
        {!loaded && (
          <motion.div className="splash" exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
            <div className="splash-grid" />
            <div className="splash-orb" />
            <motion.div
              className="splash-logo"
              initial={{ opacity: 0, scale: 0.75, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            >
              BLOCKNEXUS
            </motion.div>
            <motion.div
              className="splash-sub"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              VR-ПЛАТФОРМА ДЛЯ ГОСУДАРСТВЕННОГО УПРАВЛЕНИЯ
            </motion.div>
            <div className="splash-bar" style={{ marginTop: 36 }}>
              <div style={{
                width: `${loadPct}%`, height: '100%',
                background: 'linear-gradient(90deg, transparent, #0055ff)',
                borderRadius: 2, transition: 'width 0.28s ease',
                boxShadow: '0 0 15px rgba(0,85,255,0.4)',
              }} />
            </div>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,0,0,0.5)', marginTop: 10, letterSpacing: 3 }}
            >
              {loadPct}% — ЗАГРУЗКА 3D СРЕДЫ
            </motion.div>
            <div className="splash-version">VR EDTECH HACKATHON 2026 · АКАДЕМИЯ ГОСУДАРСТВЕННОГО УПРАВЛЕНИЯ ПРИ ПРЕЗИДЕНТЕ РК</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D CANVAS ── */}
      <div className="canvas-wrap">
        <Canvas
          camera={{ position: [0, 5, 22], fov: 60 }}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
          dpr={[1, 1.5]}
          shadows={{ type: THREE.PCFShadowMap }}
        >
          <XR store={xrStore}>
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 30, 150]} />

            {/* ── ENVIRONMENT & LIGHTING ── */}
            <ambientLight intensity={2.0} color="#ffffff" />
            <directionalLight position={[20, 40, 20]} intensity={4} color="#ffffff" castShadow />
            <spotLight position={[-20, 40, -20]} intensity={5} color="#ffffff" angle={0.5} penumbra={1} castShadow />

            {/* Main scene lights — boosted for room-scale */}
            <pointLight position={[0, 20, 10]} color="#ffffff" intensity={8} distance={120} decay={2} />
            <pointLight position={[-30, 10, -10]} color="#aaaaaa" intensity={5} distance={100} decay={2} />
            <pointLight position={[30, 10, -10]} color="#aaaaaa" intensity={5} distance={100} decay={2} />
            <pointLight position={[0, -5, 15]} color="#ffffff" intensity={3} distance={80} decay={2} />

            {/* ── ENVIRONMENT ── */}
            <StudioFloor inVR={inVR} />
            {!inVR && <ContactShadows position={[0, -8, 0]} opacity={0.6} scale={200} blur={3} far={20} />}

            {/* ── XR ORIGIN & LOCOMOTION ── */}
            <group ref={vrOriginRef} position={[0, 0, 10.0]}>
              <XROrigin />            
            </group>
            <VRLocomotion originRef={vrOriginRef} currentScene={currentScene} setCurrentScene={handleSceneChange} />

            {/* ── SOLID DARK SKYBOX ── */}
            <mesh scale={500}>
              <sphereGeometry />
              <meshBasicMaterial color="#050505" side={THREE.BackSide} depthWrite={false} fog={false} />
            </mesh>

            {/* ── STARFIELD ── */}
            <Starfield />

            {/* ── SCENE FLASH TRANSITION ── */}
            <SceneFlash trigger={currentScene} />

            {/* ── VR FLOATING MENU ── */}
            <VRFloatingMenu currentScene={currentScene} setCurrentScene={handleSceneChange} inVR={inVR} />

            {/* ── VR GROUND GRID ── */}
            <VRGroundGrid inVR={inVR} />

            {/* ── DESKTOP CONTROLS ── */}
            <DesktopControls isIdle={isIdle} currentScene={currentScene} inVR={inVR} />

            {/* ── FULL ROOM-SCALE VR (1:1 реальный масштаб) ── */}
            <group scale={1.0} position={[0, 0, 0]}>
              {/* Scene title */}
              <SceneTitle sceneId={currentScene} />

              {/* Holographic Subtitles */}
              <HoloSubtitles sceneId={currentScene} inVR={inVR} />

              {/* Scenes */}
              {currentScene === 1 && <Scene1 />}
              {currentScene === 2 && <Scene2 />}
              {currentScene === 3 && <Scene3 />}
              {currentScene === 4 && <Scene4 />}
            </group>

            {/* ── POST-PROCESSING ── */}
            <PostFX inVR={inVR} />
          </XR>
        </Canvas>
      </div>

      {/* ── HTML OVERLAY ── */}
      <div className="overlay">
        <UI
          currentScene={currentScene}
          setCurrentScene={handleSceneChange}
          onEnterVR={() => {
            xrStore.enterVR();
          }}
          narratorOn={narratorOn}
          onToggleNarrator={() => {
            const next = !narratorOn;
            setNarratorOn(next);
            if (next) playNarrator(currentScene);
            else stopNarrator();
          }}
        />
      </div>
    </>
  );
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
