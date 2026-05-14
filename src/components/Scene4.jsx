import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Float, Sphere } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { playClick, playSuccess, playBlockMined } from '../utils/audio';

/* ═══ CONSENSUS ARENA ═══ */
function ConsensusArena() {
  const ringRef1 = useRef(), ringRef2 = useRef(), ringRef3 = useRef();
  const floorGlowRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef1.current) ringRef1.current.rotation.y = t * 0.12;
    if (ringRef2.current) ringRef2.current.rotation.y = -t * 0.08;
    if (ringRef3.current) { ringRef3.current.rotation.y = t * 0.05; ringRef3.current.rotation.x = Math.sin(t * 0.3) * 0.03; }
    if (floorGlowRef.current) floorGlowRef.current.material.opacity = 0.04 + Math.sin(t * 0.6) * 0.02;
  });
  const pillarAngles = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []);
  return (
    <group>
      {/* Floor arena disc - layered */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.2, 0]}>
        <circleGeometry args={[13, 8]} />
        <meshPhysicalMaterial color="#050508" metalness={0.98} roughness={0.04} />
      </mesh>
      {/* Hex grid overlay on floor */}
      <mesh ref={floorGlowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.18, 0]}>
        <circleGeometry args={[13, 8]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.04} depthWrite={false} />
      </mesh>
      {/* Concentric arena rings */}
      {[3, 5.5, 8, 10.5, 13].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.17 + i * 0.003, 0]}>
          <ringGeometry args={[r - 0.04, r, 48]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={i === 4 ? 0.3 : 0.08} />
        </mesh>
      ))}
      {/* Center bull's eye */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.15, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
      </mesh>

      {/* 8 arena pillars — improved */}
      {pillarAngles.map((ang, i) => (
        <group key={i} position={[Math.cos(ang) * 11.5, -1.5, Math.sin(ang) * 11.5]}>
          {/* Base plate */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
            <circleGeometry args={[0.35, 8]} />
            <meshPhysicalMaterial color="#ffffff" metalness={1} roughness={0} emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>
          {/* Pillar shaft */}
          <mesh>
            <cylinderGeometry args={[0.07, 0.1, 6, 8]} />
            <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} metalness={1} roughness={0} clearcoat={1} />
          </mesh>
          {/* Corner trim lines */}
          {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((a, j) => (
            <mesh key={j} position={[Math.cos(a)*0.08, 0, Math.sin(a)*0.08]}>
              <boxGeometry args={[0.012, 6, 0.012]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
          ))}
          {/* Rooftop crystal */}
          <mesh position={[0, 3.2, 0]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} metalness={1} roughness={0} />
          </mesh>
          {/* Crystal glow ring */}
          <mesh position={[0, 3.2, 0]} rotation={[Math.PI/2, 0, (i/8)*Math.PI*2]}>
            <ringGeometry args={[0.28, 0.32, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
        </group>
      ))}

      {/* Rotating outer rings */}
      <group ref={ringRef1} position={[0, 2, 0]}>
        <mesh><torusGeometry args={[11, 0.025, 8, 80]} />
          <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} transparent opacity={0.25} />
        </mesh>
      </group>
      <group ref={ringRef2} position={[0, 1, 0]}>
        <mesh><torusGeometry args={[9.5, 0.018, 8, 60]} />
          <meshPhysicalMaterial color="#aaaaaa" emissive="#aaaaaa" emissiveIntensity={1} transparent opacity={0.2} />
        </mesh>
      </group>
      <group ref={ringRef3} position={[0, -0.5, 0]}>
        <mesh><torusGeometry args={[12, 0.015, 8, 90]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
        </mesh>
      </group>
    </group>
  );
}

function MeshBtn({ position, label, onClick, color = '#ffffff', disabled = false, width = 1.2 }) {
  const [hovered, setHovered] = useState(false);
  const { sc, emI } = useSpring({
    sc: disabled ? 1 : (hovered ? 1.05 : 1),
    emI: disabled ? 0 : (hovered ? 0.8 : 0),
    config: { tension: 300, friction: 15 }
  });
  return (
    <a.group position={position} scale={sc} 
      onPointerDown={e => { if(disabled) return; e.stopPropagation(); onClick(); playClick(); }}
      onPointerOver={() => { if(!disabled) setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh><boxGeometry args={[width, 0.35, 0.05]} /><a.meshStandardMaterial color={disabled ? '#222' : '#111'} metalness={0.5} roughness={0.5} /></mesh>
      <mesh><boxGeometry args={[width + 0.02, 0.37, 0.04]} /><a.meshStandardMaterial color={color} emissive={color} emissiveIntensity={emI} wireframe transparent opacity={disabled ? 0.1 : 0.4} depthWrite={false} /></mesh>
      <Text position={[0, 0, 0.03]} fontSize={0.12} color={disabled ? '#666' : color} anchorX="center" anchorY="middle" letterSpacing={0.05}>{label}</Text>
    </a.group>
  );
}

/* ═══ ENERGY BEAM between panels ═══ */
function EnergyBeam() {
  const ref = useRef();
  const particles = useMemo(() => {
    const n = 40; const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i*3]   = (Math.random() - 0.5) * 0.3;
      arr[i*3+1] = Math.random() * 10 - 5;
      arr[i*3+2] = (Math.random() - 0.5) * 0.3;
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 2;
  });
  return (
    <group>
      {/* Vertical plasma column */}
      <mesh><cylinderGeometry args={[0.012, 0.012, 12, 8]} />
        <meshPhysicalMaterial color="#888888" emissive="#888888" emissiveIntensity={3} transparent opacity={0.4} clearcoat={1} metalness={1} roughness={0} />
      </mesh>
      {/* Orbiting ring set */}
      <group ref={ref}>
        {[0.42, 0.26].map((r, i) => (
          <mesh key={i} rotation={[i * Math.PI / 3, 0, i * Math.PI / 5]}>
            <torusGeometry args={[r, 0.016, 8, 32]} />
            <meshPhysicalMaterial color={i===0?"#ffffff":"#cccccc"} emissive={i===0?"#ffffff":"#cccccc"} emissiveIntensity={5} clearcoat={1} metalness={1} roughness={0} />
          </mesh>
        ))}
      </group>
      {/* Floating particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={40} array={particles} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#111111" transparent opacity={0.7} sizeAttenuation />
      </points>
      <Text position={[0, 4.2, 0]} fontSize={0.24} color="#ffffff" anchorX="center" letterSpacing={0.12} outlineWidth={0.006} outlineColor="#000000">VS</Text>
      {[['Speed', '5-7s', '~0.4s', '#aaaaaa', '#ffffff'], ['Energy', '1500W', '0.5W', '#ff3333', '#ffffff'], ['Ratio', '1×', '3000×', '#aaaaaa', '#ffffff']].map(([k, v1, v2, c1, c2], i) => (
        <group key={i} position={[0, -4.0 - i * 0.44, 0]}>
          <Text position={[-1.4, 0, 0]} fontSize={0.13} color={c1} anchorX="right" outlineWidth={0.004} outlineColor="#ffffff">{v1}</Text>
          <Text position={[0, 0, 0]} fontSize={0.1} color="#334" anchorX="center" letterSpacing={0.05}>{k}</Text>
          <Text position={[1.4, 0, 0]} fontSize={0.13} color={c2} anchorX="left" outlineWidth={0.004} outlineColor="#ffffff">{v2}</Text>
        </group>
      ))}
    </group>
  );
}

/* ═══ GPU MINING RIG — holographic cube ═══ */
function MiningRig({ position, mining, winner }) {
  const ref = useRef(); const glowRef = useRef(); const chassisRef = useRef();
  const col  = winner ? '#ffffff' : mining ? '#aaaaaa' : '#111111';
  const { emI, sc } = useSpring({ emI: winner ? 8 : mining ? 4 : 0.3, sc: winner ? 1.2 : 1, config: { tension: 90, friction: 16 } });
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (mining && !winner) {
      ref.current.position.x = position[0] + (Math.random() - 0.5) * 0.08;
      ref.current.position.y = position[1] + (Math.random() - 0.5) * 0.06;
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 22) * 0.03;
    } else {
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, position[0], 0.14);
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, position[1], 0.14);
      ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0, 0.1);
    }
    if (glowRef.current) glowRef.current.material.opacity = (mining || winner) ? 0.07 + Math.sin(clock.elapsedTime * 4) * 0.04 : 0;
    if (chassisRef.current) chassisRef.current.rotation.y = clock.elapsedTime * (mining ? 0.8 : 0.2);
  });
  return (
    <a.group ref={ref} position={position} scale={sc}>
      {/* Glow sphere */}
      <mesh ref={glowRef}><sphereGeometry args={[0.82, 16, 16]} /><meshBasicMaterial color={col} transparent opacity={0} side={THREE.BackSide} /></mesh>
      {/* GPU chassis base */}
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.78, 0.14, 0.52]} />
        <meshPhysicalMaterial color="#0a0a0a" metalness={0.95} roughness={0.1} clearcoat={0.8} />
      </mesh>
      {/* Chassis border glow */}
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.8, 0.16, 0.54]} />
        <a.meshBasicMaterial color={col} wireframe transparent opacity={0.3} depthWrite={false} />
      </mesh>
      {/* Main core — octahedron */}
      <group ref={chassisRef}>
        <mesh>
          <octahedronGeometry args={[0.38, 0]} />
          <a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} metalness={1} roughness={0} clearcoat={1} />
        </mesh>
        {/* Wireframe shell */}
        <mesh>
          <octahedronGeometry args={[0.42, 0]} />
          <a.meshBasicMaterial color={col} wireframe transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>
      {/* GPU heat fins — 5 fins */}
      {[-0.2, -0.1, 0, 0.1, 0.2].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.46]}>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
          <a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} metalness={1} roughness={0.1} />
        </mesh>
      ))}
      {/* Power LED strip */}
      <mesh position={[0, -0.21, 0.28]}>
        <boxGeometry args={[0.7, 0.025, 0.025]} />
        <a.meshBasicMaterial color={col} transparent opacity={mining ? 1 : 0.3} />
      </mesh>
      {winner && <Text position={[0, 0.72, 0]} fontSize={0.22} color="#ffffff" anchorX="center">✓</Text>}
      {mining && !winner && (
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[0.56, 0.012, 8, 32]} />
          <a.meshPhysicalMaterial color="#aaaaaa" emissive="#aaaaaa" emissiveIntensity={emI} transparent opacity={0.5} />
        </mesh>
      )}
    </a.group>
  );
}

/* ═══ HASHRATE VISUALIZER ═══ */
function HashrateViz({ position, level, color, label }) {
  const bars = 12;
  return (
    <group position={position}>
      {/* Background plate */}
      <mesh position={[0, 0.3, -0.02]}>
        <boxGeometry args={[0.22, 1.85, 0.04]} />
        <meshPhysicalMaterial color="#080810" metalness={0.9} roughness={0.1} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.3, -0.01]}>
        <boxGeometry args={[0.24, 1.87, 0.03]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.2} depthWrite={false} />
      </mesh>
      {Array.from({ length: bars }).map((_, i) => {
        const active = (i / bars) < level;
        return (
          <mesh key={i} position={[0, i * 0.14 - 0.45, 0]}>
            <boxGeometry args={[0.13, 0.1, 0.07]} />
            <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={active ? 3.5 : 0.1} transparent opacity={active ? 0.95 : 0.15} clearcoat={1} metalness={1} roughness={0} />
          </mesh>
        );
      })}
      <Text position={[0, 1.25, 0]} fontSize={0.1} color={color} anchorX="center" letterSpacing={0.04}>{label}</Text>
    </group>
  );
}

/* ═══ PROOF OF WORK — complete redesign ═══ */
function PoWPanel({ position }) {
  const [mining, setMining] = useState(false);
  const [winner, setWinner] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [energy, setEnergy]   = useState(0);
  const [hashRate, setHashRate] = useState(0);
  const startRef = useRef(null);
  const timerRef = useRef(null);
  const hashRef  = useRef(null);

  const rigPos = [[-1.1, 1.1, 0], [1.1, 1.1, 0], [-1.1, -0.2, 0], [1.1, -0.2, 0]];

  useFrame(() => {
    if (mining && startRef.current) {
      const e = (Date.now() - startRef.current) / 1000;
      setElapsed(+e.toFixed(1));
      setEnergy(Math.min(e / 6.5, 1));
      setHashRate(Math.min(e / 6.5, 1));
    }
  });

  const start = () => {
    if (mining) return;
    playClick(); setMining(true); setWinner(-1); setEnergy(0);
    startRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      setMining(false); setWinner(Math.floor(Math.random() * 4)); playBlockMined();
    }, 5000 + Math.random() * 2500);
    hashRef.current = setInterval(() => setHashRate(Math.random()), 200);
  };

  const reset = () => {
    clearTimeout(timerRef.current); clearInterval(hashRef.current);
    setMining(false); setWinner(-1); setElapsed(0); setEnergy(0); setHashRate(0);
  };

  const statusCol = winner >= 0 ? '#ffffff' : mining ? '#aaaaaa' : '#dddddd';
  const panelRef  = useRef();
  useFrame(({ clock }) => {
    if (panelRef.current) panelRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.03;
  });

  return (
    <group ref={panelRef} position={position}>
      {/* Premium backing plate */}
      <mesh position={[0, 0, -0.35]}>
        <boxGeometry args={[4.5, 8.0, 0.06]} />
        <meshPhysicalMaterial color="#070710" metalness={0.98} roughness={0.04} clearcoat={1} />
      </mesh>
      {/* Border glow */}
      <mesh position={[0, 0, -0.32]}>
        <boxGeometry args={[4.55, 8.05, 0.04]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.06} depthWrite={false} />
      </mesh>
      {/* Corner LED accents */}
      {[[-2.2, 3.8], [2.2, 3.8], [-2.2, -3.8], [2.2, -3.8]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, -0.28]}>
          <boxGeometry args={[0.12, 0.12, 0.05]} />
          <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} metalness={1} roughness={0} />
        </mesh>
      ))}
      {/* Top/bottom accent lines */}
      <mesh position={[0, 3.95, -0.3]}><boxGeometry args={[4.0, 0.014, 0.04]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} /></mesh>
      <mesh position={[0, -3.95, -0.3]}><boxGeometry args={[4.0, 0.014, 0.04]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.25} depthWrite={false} /></mesh>

      {/* Title */}
      <Text position={[0, 3.4, 0]} fontSize={0.38} color="#ffffff" anchorX="center" outlineWidth={0.006} outlineColor="#000000" letterSpacing={0.08}>PROOF OF WORK</Text>
      <Text position={[0, 2.95, 0]} fontSize={0.11} color="#666666" anchorX="center" letterSpacing={0.04}>SHA-256 · ФЕРМА GPU · КОНКУРЕНТНЫЙ</Text>
      {/* Accent line */}
      <mesh position={[0, 2.75, 0]}><planeGeometry args={[3.6, 0.007]} /><meshBasicMaterial color="#555555" transparent opacity={0.6} /></mesh>

      {/* 4 mining rigs in 2x2 grid */}
      {rigPos.map((p, i) => <MiningRig key={i} position={p} mining={mining} winner={winner === i} />)}

      {/* Hash rate visualizer */}
      <HashrateViz position={[-2.2, 0.5, 0]} level={energy} color="#ffffff" label="TH/s" />

      {/* Status */}
      <Text position={[0, -1.55, 0]} fontSize={0.2} color={statusCol} anchorX="center" outlineWidth={0.005} outlineColor="#000000">
        {winner >= 0 ? `🟢 БЛОК НАЙДЕН · ${elapsed}с` : mining ? `⛏ ${elapsed}с — МАЙНИНГ...` : '⛏ ГОТОВО К РАБОТЕ'}
      </Text>

      {/* Metrics strip */}
      <group position={[0, -2.1, 0]}>
        {[['ЭНЕРГИЯ', mining || winner >= 0 ? `${Math.round(elapsed * 1500)}Вт·ч` : '—', '#ff3333'],
          ['ГОС. БЮДЖЕТ', mining || winner >= 0 ? `-${(elapsed * 3500).toFixed(0)} ₸` : '—', '#ff5555'],
          ['АЛГОРИТМ', 'SHA-256', '#aaaaaa']].map(([k, v, c], i) => (
          <group key={i} position={[(i - 1) * 1.35, 0, 0]}>
            <mesh><boxGeometry args={[1.2, 0.52, 0.06]} /><meshBasicMaterial color="#111111" transparent opacity={0.8} /></mesh>
            <mesh><boxGeometry args={[1.22, 0.54, 0.05]} /><meshBasicMaterial color={c} wireframe transparent opacity={0.25} depthWrite={false} /></mesh>
            <Text position={[0, 0.1, 0.04]} fontSize={0.09} color={c} anchorX="center">{k}</Text>
            <Text position={[0, -0.1, 0.04]} fontSize={0.12} color="#ffffff" anchorX="center">{v}</Text>
          </group>
        ))}
      </group>

      <group position={[0, -2.0, 0]}>
        <MeshBtn 
          position={mining || winner >= 0 ? [-0.6, 0, 0] : [0, 0, 0]} 
          label={mining ? '⛏ МАЙНИНГ...' : '▶ НАЙТИ БЛОК'} 
          color="#ff9500" 
          onClick={start} 
          disabled={mining} 
          width={1.0} 
        />
        {(mining || winner >= 0) && (
          <MeshBtn 
            position={[0.6, 0, 0]} 
            label="↺" 
            color="#00aaff" 
            onClick={reset} 
            width={0.4} 
          />
        )}
      </group>

      <Text position={[0, -2.35, 0]} fontSize={0.11} color="#ff3333" anchorX="center">НЕЭФФЕКТИВНЫЙ РАСХОД ГОСБЮДЖЕТА · ВЫСОКИЙ CO₂ 🔴</Text>
    </group>
  );
}

/* ═══ VALIDATOR ORB — holographic ═══ */
function ValidatorOrb({ position, stake, selected, totalStake, label }) {
  const sz  = 0.22 + stake * 0.028;
  const col = selected ? '#ffffff' : '#aaaaaa';
  const { emI, sc } = useSpring({ emI: selected ? 9 : 1.2, sc: selected ? 1.35 : 1, config: { tension: 100, friction: 14 } });
  const r1 = useRef(), r2 = useRef();
  const pct = Math.round((stake / totalStake) * 100);

  useFrame(({ clock }) => {
    if (r1.current) r1.current.rotation.z = clock.elapsedTime * 1.4;
    if (r2.current) r2.current.rotation.z = -clock.elapsedTime * 0.9; r2.current && (r2.current.rotation.x = clock.elapsedTime * 0.6);
  });

  return (
    <Float speed={1.8} floatIntensity={selected ? 0.4 : 0.15} rotationIntensity={0}>
      <a.group position={position} scale={sc}>
        {/* Outer glow */}
        <mesh><sphereGeometry args={[sz * 1.5, 16, 16]} /><meshBasicMaterial color={col} transparent opacity={selected ? 0.07 : 0.02} side={THREE.BackSide} /></mesh>
        {/* Core sphere */}
        <mesh><sphereGeometry args={[sz, 20, 20]} /><a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} metalness={1} roughness={0} clearcoat={1} /></mesh>
        {/* Inner detail */}
        <mesh><icosahedronGeometry args={[sz * 0.65, 0]} /><a.meshPhysicalMaterial color="#111" emissive={col} emissiveIntensity={emI} wireframe transparent opacity={0.2} depthWrite={false} /></mesh>
        {/* Orbit rings */}
        <group ref={r1}><mesh><torusGeometry args={[sz + 0.12, 0.012, 8, 32]} /><a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} transparent opacity={0.55} /></mesh></group>
        <group ref={r2} rotation={[Math.PI/3, 0, 0]}><mesh><torusGeometry args={[sz + 0.07, 0.008, 6, 24]} /><a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} transparent opacity={0.35} /></mesh></group>
        <Text position={[0, sz + 0.26, 0]} fontSize={0.13} color="#ffffff" anchorX="center">{stake}Ξ</Text>
        <Text position={[0, sz + 0.12, 0]} fontSize={0.09} color={col} anchorX="center">{pct}%</Text>
        {selected && <Text position={[0, sz + 0.45, 0]} fontSize={0.18} color="#ffffff" anchorX="center">✓</Text>}
      </a.group>
    </Float>
  );
}

/* ═══ PROOF OF STAKE — hexagonal layout ═══ */
function PoSPanel({ position }) {
  const stakes     = [3, 14, 2, 8, 5, 10];
  const totalStake = stakes.reduce((a, b) => a + b, 0);
  const [winner, setWinner]   = useState(-1);
  const [running, setRunning] = useState(false);
  const [round, setRound]     = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);

  // Hexagonal layout
  const valPos = useMemo(() => {
    const r = 1.35, r2 = 0.7;
    return [
      [0, r2, 0],
      [r * Math.cos(Math.PI/6), r * Math.sin(Math.PI/6) * 0.55, 0],
      [r * Math.cos(Math.PI/6), -r * Math.sin(Math.PI/6) * 0.55, 0],
      [0, -r2, 0],
      [-r * Math.cos(Math.PI/6), -r * Math.sin(Math.PI/6) * 0.55, 0],
      [-r * Math.cos(Math.PI/6), r * Math.sin(Math.PI/6) * 0.55, 0],
    ];
  }, []);

  useFrame(() => {
    if (running && startRef.current) setElapsed(((Date.now() - startRef.current) / 1000).toFixed(3));
  });

  const select = () => {
    if (running) return;
    playClick(); setRunning(true); setWinner(-1);
    startRef.current = Date.now();
    setTimeout(() => {
      let r = Math.random() * totalStake;
      let w = 0;
      for (let i = 0; i < stakes.length; i++) { if (r < stakes[i]) { w = i; break; } r -= stakes[i]; }
      setWinner(w); setRunning(false); setRound(n => n + 1); playSuccess();
    }, 280 + Math.random() * 380);
  };

  const statusCol = winner >= 0 ? '#ffffff' : running ? '#cccccc' : '#ffffff';
  const panelRef  = useRef();
  useFrame(({ clock }) => {
    if (panelRef.current) panelRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.22 + 1) * 0.03;
  });

  return (
    <group ref={panelRef} position={position}>
      {/* Premium backing plate */}
      <mesh position={[0, 0, -0.35]}>
        <boxGeometry args={[4.5, 8.0, 0.06]} />
        <meshPhysicalMaterial color="#070710" metalness={0.98} roughness={0.04} clearcoat={1} />
      </mesh>
      {/* Border glow */}
      <mesh position={[0, 0, -0.32]}>
        <boxGeometry args={[4.55, 8.05, 0.04]} />
        <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.06} depthWrite={false} />
      </mesh>
      {/* Corner LED accents */}
      {[[-2.2, 3.8], [2.2, 3.8], [-2.2, -3.8], [2.2, -3.8]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, -0.28]}>
          <boxGeometry args={[0.12, 0.12, 0.05]} />
          <meshPhysicalMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={3} metalness={1} roughness={0} />
        </mesh>
      ))}
      {/* Top/bottom accent lines */}
      <mesh position={[0, 3.95, -0.3]}><boxGeometry args={[4.0, 0.014, 0.04]} /><meshBasicMaterial color="#00ff88" transparent opacity={0.4} depthWrite={false} /></mesh>
      <mesh position={[0, -3.95, -0.3]}><boxGeometry args={[4.0, 0.014, 0.04]} /><meshBasicMaterial color="#00ff88" transparent opacity={0.25} depthWrite={false} /></mesh>

      {/* Title */}
      <Text position={[0, 3.4, 0]} fontSize={0.38} color="#ffffff" anchorX="center" outlineWidth={0.006} outlineColor="#000000" letterSpacing={0.08}>PROOF OF STAKE</Text>
      <Text position={[0, 2.95, 0]} fontSize={0.11} color="#00ff88" anchorX="center" letterSpacing={0.04}>РЕКОМЕНДОВАНО ДЛЯ ГОСУДАРСТВЕННЫХ СЕТЕЙ</Text>
      <mesh position={[0, 2.75, 0]}><planeGeometry args={[3.6, 0.007]} /><meshBasicMaterial color="#00ff88" transparent opacity={0.6} /></mesh>

      {/* Hexagonal validators */}
      {valPos.map((p, i) => (
        <ValidatorOrb key={i} position={p} stake={stakes[i]} selected={winner === i} totalStake={totalStake} label={`V${i+1}`} />
      ))}

      {/* Connection lines between validators */}
      {valPos.map((p, i) => {
        const next = valPos[(i + 1) % valPos.length];
        const pts = [new THREE.Vector3(...p), new THREE.Vector3(...next)];
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        return (
          <line key={i} geometry={geom}>
            <lineBasicMaterial color={winner >= 0 ? '#ffffff' : '#888888'} transparent opacity={0.15} />
          </line>
        );
      })}

      {/* Central nexus */}
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshPhysicalMaterial color={winner >= 0 ? '#ffffff' : '#888888'} emissive={winner >= 0 ? '#ffffff' : '#888888'} emissiveIntensity={running ? 6 : 2} metalness={1} clearcoat={1} roughness={0} />
      </mesh>

      {/* Status */}
      <Text position={[0, -1.68, 0]} fontSize={0.2} color={statusCol} anchorX="center" outlineWidth={0.005} outlineColor="#000000">
        {winner >= 0 ? `🟢 ВЫБРАН УЗЕЛ V${winner+1} · ${elapsed}с` : running ? '🔄 ИДЕТ ВЫБОР...' : `⚡ РАУНД ${round}`}
      </Text>

      {/* Metrics */}
      <group position={[0, -2.22, 0]}>
        {[['ЭНЕРГИЯ', '0.5Вт', '#ffffff'], ['ГОС. БЮДЖЕТ', '-1.2 ₸', '#00ff88'], ['АЛГОРИТМ', 'PoS+VRF', '#aaaaaa']].map(([k, v, c], i) => (
          <group key={i} position={[(i - 1) * 1.35, 0, 0]}>
            <mesh><boxGeometry args={[1.2, 0.52, 0.06]} /><meshBasicMaterial color="#111111" transparent opacity={0.8} /></mesh>
            <mesh><boxGeometry args={[1.22, 0.54, 0.05]} /><meshBasicMaterial color={c} wireframe transparent opacity={0.25} depthWrite={false} /></mesh>
            <Text position={[0, 0.1, 0.04]} fontSize={0.09} color={c} anchorX="center">{k}</Text>
            <Text position={[0, -0.1, 0.04]} fontSize={0.12} color="#ffffff" anchorX="center">{v}</Text>
          </group>
        ))}
      </group>

      <group position={[0, -2.0, 0]}>
        <MeshBtn 
          position={winner >= 0 ? [-0.6, 0, 0] : [0, 0, 0]} 
          label={running ? '🔄 ВЫБОР...' : '▶ НАЗНАЧИТЬ ВАЛИДАТОРА'} 
          color="#00aaff" 
          onClick={select} 
          disabled={running} 
          width={1.1} 
        />
        {winner >= 0 && (
          <MeshBtn 
            position={[0.6, 0, 0]} 
            label="↺" 
            color="#00aaff" 
            onClick={() => setWinner(-1)} 
            width={0.4} 
          />
        )}
      </group>

      <Text position={[0, -2.35, 0]} fontSize={0.11} color="#555555" anchorX="center">ИДЕАЛЬНО ДЛЯ ГОССЕКТОРА · ЭКО 🟢 · В 3000 РАЗ ДЕШЕВЛЕ</Text>
    </group>
  );
}

export default function Scene4() {
  return (
    <group position={[0, 2.8, 0]}>
      <ConsensusArena />
      <PoWPanel position={[-5.5, 0, 0]} />
      <EnergyBeam />
      <PoSPanel position={[5.5, 0, 0]} />
    </group>
  );
}
