import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Sphere, Torus, Float, Icosahedron } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { playSuccess, playError, playClick, playLaser, playUnlock } from '../utils/audio';

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
      <mesh><boxGeometry args={[width, 0.42, 0.07]} /><a.meshPhysicalMaterial color={disabled ? '#111' : '#090910'} metalness={0.9} roughness={0.1} clearcoat={1} /></mesh>
      <mesh><boxGeometry args={[width + 0.03, 0.45, 0.055]} /><a.meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={emI} wireframe transparent opacity={disabled ? 0.08 : 0.45} depthWrite={false} /></mesh>
      {/* Top accent bar */}
      <mesh position={[0, 0.215, 0]}><boxGeometry args={[width, 0.013, 0.075]} /><a.meshBasicMaterial color={color} transparent opacity={hovered ? 1 : 0.5} /></mesh>
      <Text position={[0, 0, 0.04]} fontSize={0.14} color={disabled ? '#444' : '#ffffff'} anchorX="center" anchorY="middle" letterSpacing={0.06} outlineWidth={0.004} outlineColor="#000">{label}</Text>
    </a.group>
  );
}

/* ═══ HEXAGONAL FLOOR ═══ */
function HexFloor({ radius = 12, color = '#ffffff' }) {
  const glowRef = useRef();
  useFrame(({ clock }) => {
    if (glowRef.current) glowRef.current.material.opacity = 0.03 + Math.sin(clock.elapsedTime * 0.5) * 0.015;
  });
  return (
    <group position={[0, -5.2, 2]}>
      {/* Dark base */}
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[radius, 6]} />
        <meshPhysicalMaterial color="#060610" metalness={0.98} roughness={0.04} />
      </mesh>
      {/* Hex wireframe overlay */}
      <mesh ref={glowRef} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[radius, 6]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.04} depthWrite={false} />
      </mesh>
      {/* Concentric hex rings */}
      {[3, 5.5, 8, 10.5].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01 + i * 0.002, 0]}>
          <ringGeometry args={[r - 0.04, r, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} />
        </mesh>
      ))}
      {/* Outer border glow */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[radius - 0.06, radius, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/* ═══ SECURITY LASER GRID ═══ */
function SecurityLasers({ active, color }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.visible = active;
      if (active) ref.current.rotation.y = clock.elapsedTime * 1.2;
    }
  });
  return (
    <group ref={ref} position={[0, 5, 0]}>
      {[0, Math.PI/3, Math.PI*2/3].map((ang, i) => (
        <group key={i} rotation={[0, ang, 0]}>
          <mesh rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.008, 0.008, 16, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
      {/* Scan ring */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[5.2, 0.02, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/* ═══ VAULT PEDESTAL ═══ */
function VaultPedestal({ col }) {
  return (
    <group position={[0, -1.8, 0]}>
      {/* Wide octagonal base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2.8, 3.2, 0.22, 8]} />
        <meshPhysicalMaterial color="#080810" metalness={0.98} roughness={0.04} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[2.85, 2.85, 0.04, 8]} />
        <meshBasicMaterial color={col} transparent opacity={0.5} />
      </mesh>
      {/* Mid platform */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[2.0, 2.4, 0.18, 8]} />
        <meshPhysicalMaterial color="#0a0a14" metalness={0.95} roughness={0.06} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[2.05, 2.05, 0.04, 8]} />
        <meshBasicMaterial color={col} transparent opacity={0.35} />
      </mesh>
      {/* Narrow top pillar */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.8, 1.0, 2.0, 8]} />
        <meshPhysicalMaterial color="#090912" metalness={0.97} roughness={0.05} clearcoat={1} />
      </mesh>
      <mesh position={[0, 2.42, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 0.06, 8]} />
        <meshBasicMaterial color={col} transparent opacity={0.6} />
      </mesh>
      {/* Corner accent pillars around base */}
      {Array.from({ length: 8 }, (_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(ang) * 2.5, 0.55, Math.sin(ang) * 2.5]}>
            <mesh><cylinderGeometry args={[0.055, 0.055, 0.9, 6]} /><meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={1.2} metalness={1} roughness={0} /></mesh>
            <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.065, 8, 8]} /><meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={3} metalness={1} roughness={0} /></mesh>
          </group>
        );
      })}
    </group>
  );
}


/* ═══ ORBIT PARTICLES ═══ */
function OrbitParticles({ count = 180, radius = 4.5, color, active }) {
  const ref = useRef();
  const posArr = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      arr[i*3]   = radius * Math.sin(phi) * Math.cos(theta);
      arr[i*3+1] = radius * Math.sin(phi) * Math.sin(theta) * 0.45;
      arr[i*3+2] = radius * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.22;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.14) * 0.15;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={posArr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={color} transparent opacity={active ? 0.85 : 0.3} sizeAttenuation />
    </points>
  );
}

/* ═══ DNA HELIX ═══ */
function DNAHelix({ color1, color2, radius = 5, height = 14 }) {
  const ref1 = useRef(), ref2 = useRef();
  const N = 60;
  const pos1 = useMemo(() => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 6;
      a[i*3]   = Math.cos(t) * radius * 0.5;
      a[i*3+1] = (i / N) * height - height / 2;
      a[i*3+2] = Math.sin(t) * radius * 0.5;
    }
    return a;
  }, []);
  const pos2 = useMemo(() => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 6 + Math.PI;
      a[i*3]   = Math.cos(t) * radius * 0.5;
      a[i*3+1] = (i / N) * height - height / 2;
      a[i*3+2] = Math.sin(t) * radius * 0.5;
    }
    return a;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.18;
    if (ref1.current) ref1.current.rotation.y = t;
    if (ref2.current) ref2.current.rotation.y = t;
  });
  return (
    <group>
      <points ref={ref1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={N} array={pos1} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.12} color={color1} transparent opacity={0.7} sizeAttenuation />
      </points>
      <points ref={ref2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={N} array={pos2} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.12} color={color2} transparent opacity={0.7} sizeAttenuation />
      </points>
    </group>
  );
}

/* ═══ HOLOGRAPHIC VAULT SPHERE ═══ */
function HoloVault({ state }) {
  const isOpen = state === 'success';
  const isError = state === 'error';
  const isScanning = state === 'scanning';

  const col = isOpen ? '#00ff88' : isError ? '#ff3333' : isScanning ? '#aaaaaa' : '#ffffff';
  const col2 = isOpen ? '#00cc66' : isError ? '#ff5555' : isScanning ? '#cccccc' : '#cccccc';

  const coreRef   = useRef();
  const shell1Ref = useRef();
  const shell2Ref = useRef();
  const shell3Ref = useRef();
  const ring1Ref  = useRef();
  const ring2Ref  = useRef();
  const ring3Ref  = useRef();
  const glowRef   = useRef();

  const { emI, sc, shellOp } = useSpring({
    emI:    isOpen ? 8 : isError ? 6 : isScanning ? 4 : 1.5,
    sc:     isOpen ? 1.15 : 1,
    shellOp: isScanning ? 0.35 : isOpen ? 0.55 : 0.18,
    config: { mass: 3, tension: 60, friction: 22 },
  });

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (shell1Ref.current) { shell1Ref.current.rotation.y = t * 0.28; shell1Ref.current.rotation.x = t * 0.12; }
    if (shell2Ref.current) { shell2Ref.current.rotation.y = -t * 0.19; shell2Ref.current.rotation.z = t * 0.09; }
    if (shell3Ref.current) { shell3Ref.current.rotation.x = t * 0.15; shell3Ref.current.rotation.z = -t * 0.22; }
    if (ring1Ref.current)  { ring1Ref.current.rotation.z = t * 0.55; }
    if (ring2Ref.current)  { ring2Ref.current.rotation.z = -t * 0.38; ring2Ref.current.rotation.x = t * 0.12; }
    if (ring3Ref.current)  { ring3Ref.current.rotation.y = t * 0.45; ring3Ref.current.rotation.x = -t * 0.18; }
    if (coreRef.current)   {
      coreRef.current.rotation.y = t * 0.6;
      const pulse = 1 + Math.sin(t * 2.5) * (isScanning ? 0.12 : 0.04);
      coreRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.08 + Math.sin(t * 1.8) * 0.05;
    }
  });

  return (
    <a.group scale={sc}>
      {/* Outer glow bloom sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[5.2, 32, 32]} />
        <meshBasicMaterial color={col} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>

      <group ref={shell1Ref}>
        <mesh>
          <icosahedronGeometry args={[3.9, 1]} />
          <a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} wireframe transparent opacity={shellOp} clearcoat={1} metalness={1} roughness={0.1} depthWrite={false} />
        </mesh>
      </group>
      <group ref={shell2Ref}>
        <mesh>
          <icosahedronGeometry args={[3.2, 1]} />
          <a.meshPhysicalMaterial color={col2} emissive={col2} emissiveIntensity={emI} wireframe transparent opacity={shellOp} clearcoat={1} metalness={1} roughness={0.1} depthWrite={false} />
        </mesh>
      </group>
      <group ref={shell3Ref}>
        <mesh>
          <dodecahedronGeometry args={[2.5, 0]} />
          <a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} wireframe transparent opacity={shellOp} clearcoat={1} metalness={1} roughness={0.1} depthWrite={false} />
        </mesh>
      </group>

      {/* Orbit rings at different planes */}
      <group ref={ring1Ref}>
        <mesh><torusGeometry args={[4.4, 0.022, 16, 120]} /><a.meshStandardMaterial color={col} emissive={col} emissiveIntensity={emI} transparent opacity={0.6} /></mesh>
        {[0, 1, 2, 3, 5, 7, 11].map(i => {
          const a2 = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a2)*4.4, Math.sin(a2)*4.4, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <a.meshStandardMaterial color={col} emissive={col} emissiveIntensity={emI} />
            </mesh>
          );
        })}
      </group>
      <group ref={ring2Ref} rotation={[Math.PI / 2.5, 0, 0]}>
        <mesh><torusGeometry args={[3.7, 0.018, 16, 100]} /><a.meshStandardMaterial color={col2} emissive={col2} emissiveIntensity={emI} transparent opacity={0.5} /></mesh>
      </group>
      <group ref={ring3Ref} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
        <mesh><torusGeometry args={[3.1, 0.014, 16, 80]} /><a.meshStandardMaterial color={col} emissive={col} emissiveIntensity={emI} transparent opacity={0.4} /></mesh>
      </group>

      {/* Inner energy core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[1.1, 2]} />
        <a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} metalness={1} roughness={0} clearcoat={1} wireframe={false} />
      </mesh>
      {/* Core inner glow */}
      <mesh>
        <sphereGeometry args={[0.7, 24, 24]} />
        <a.meshPhysicalMaterial color="#111111" transmission={0.9} thickness={1.5} ior={1.8} roughness={0} transparent opacity={0.6} />
      </mesh>
      
      {/* Visual Keyhole Lock Mechanism */}
      <group position={[0, 0, 1.2]}>
        <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.3, 0.3, 0.05, 16]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} /></mesh>
        <mesh position={[0, 0.05, 0.02]}><cylinderGeometry args={[0.08, 0.08, 0.06, 16]} rotation={[Math.PI/2, 0, 0]} /><meshStandardMaterial color={isOpen ? "#00ff88" : "#ff3333"} emissive={isOpen ? "#00ff88" : "#ff3333"} emissiveIntensity={2} /></mesh>
        <mesh position={[0, -0.1, 0.02]}><boxGeometry args={[0.08, 0.16, 0.06]} /><meshStandardMaterial color={isOpen ? "#00ff88" : "#ff3333"} emissive={isOpen ? "#00ff88" : "#ff3333"} emissiveIntensity={2} /></mesh>
      </group>

      {/* Status text */}
      <Text position={[0, -5.8, 0]} fontSize={0.55} color={col} anchorX="center" outlineWidth={0.008} outlineColor="#000000">
        {state === 'idle' ? '🔒 ЗАБЛОКИРОВАНО' : state === 'scanning' ? '⚡ СКАНИРОВАНИЕ...' : state === 'success' ? '🟢 ДОСТУП РАЗРЕШЕН' : '🔴 В ДОСТУПЕ ОТКАЗАНО'}
      </Text>
      <Text position={[0, -6.55, 0]} fontSize={0.15} color={col} anchorX="center" letterSpacing={0.06} opacity={0.7}>
        {state === 'idle' ? 'ВЫБЕРИТЕ ВАШУ ЭЦП ДЛЯ ДОСТУПА К ГОСУДАРСТВЕННЫМ ДАННЫМ'
          : state === 'scanning' ? 'ПРОВЕРКА ВАЛИДНОСТИ ЭЦП...'
          : state === 'success' ? 'ЭЦП ПОДТВЕРЖДЕНА — ДАННЫЕ РАЗБЛОКИРОВАНЫ'
          : 'НЕДЕЙСТВИТЕЛЬНАЯ ЭЦП — ДОСТУП В АРХИВ ЗАПРЕЩЕН'}
      </Text>
    </a.group>
  );
}

/* ═══ HOLOGRAPHIC SCAN BURST ═══ */
function ScanBurst({ active, success }) {
  const ref = useRef();
  const count = 80;
  const posArr = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const r = 2 + Math.random() * 5;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      arr[i]   = r * Math.sin(p) * Math.cos(t);
      arr[i+1] = r * Math.sin(p) * Math.sin(t);
      arr[i+2] = r * Math.cos(p);
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.visible = active;
      if (active) { ref.current.rotation.y = clock.elapsedTime * 3; ref.current.rotation.x = clock.elapsedTime * 1.5; }
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={posArr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color={success ? '#00ff88' : '#ff3333'} transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

/* ═══ CYBER KEY CARD ═══ */
function KeyCard({ position, label, sublabel, isCorrect, onClick, disabled, isActive, isHidden }) {
  const [hovered, setHovered] = useState(false);
  const col = isCorrect ? '#00ff88' : '#ff3333';
  const accentCol = isCorrect ? '#003311' : '#330000';
  
  // Animate position to center if active, and hide if another key is active
  const { sc, emI, pos, op } = useSpring({ 
    sc: isHidden ? 0 : isActive ? 0.6 : hovered && !disabled ? 1.14 : 1, 
    emI: isActive ? 6 : hovered ? 4 : 1.4, 
    pos: isActive ? [0, 0, 0] : position,
    op: isHidden ? 0 : 1,
    config: { mass: isActive ? 1.5 : 1, tension: isActive ? 120 : 220, friction: 20 } 
  });
  
  const ref = useRef();
  const scanRef = useRef();

  useFrame(({ clock }) => {
    if (ref.current && !isActive) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.8 + (isCorrect ? 0 : Math.PI)) * 0.14;
    if (ref.current && isActive) {
       ref.current.rotation.y = clock.elapsedTime * 2; // spin while scanning
       ref.current.rotation.x = Math.sin(clock.elapsedTime * 5) * 0.1; // vibrate
    }
    if (scanRef.current && (hovered || isActive) && !disabled) scanRef.current.position.y = ((clock.elapsedTime * 1.3) % 3.4) - 1.7;
  });

  if (isHidden) return null;

  return (
    <Float speed={isActive ? 0 : 2.2} floatIntensity={isActive ? 0 : 0.28} rotationIntensity={0}>
      <a.group ref={ref} position={pos} scale={sc}
        onPointerDown={e => { e.stopPropagation(); if (!disabled && !isActive) onClick(isCorrect); }}
        onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}
      >
        <a.group scale={op}>
        {/* Card body */}
        <mesh><boxGeometry args={[2.2, 3.4, 0.12]} /><meshPhysicalMaterial color="#f5f5f7" transmission={0.5} roughness={0.1} clearcoat={1} metalness={0.8} ior={1.4} /></mesh>
        {/* Glow border wireframe */}
        <mesh><boxGeometry args={[2.24, 3.44, 0.08]} /><a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} wireframe transparent opacity={0.55} depthWrite={false} /></mesh>
        {/* Top stripe */}
        <mesh position={[0, 1.55, 0]}><boxGeometry args={[2.2, 0.35, 0.13]} /><a.meshPhysicalMaterial color={accentCol} emissive={col} emissiveIntensity={emI} /></mesh>
        {/* Holographic chip */}
        <group position={[-0.5, 0.4, 0.07]}>
          <mesh><boxGeometry args={[0.55, 0.42, 0.04]} /><meshPhysicalMaterial color="#111111" metalness={1} roughness={0} /></mesh>
          {[[-0.12,-0.1],[0.12,-0.1],[-0.12,0.1],[0.12,0.1]].map(([x,y],i) => (
            <mesh key={i} position={[x,y,0]}><boxGeometry args={[0.08,0.06,0.05]} /><a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} /></mesh>
          ))}
          {[-0.12,0,0.12].map((x,i) => (
            <mesh key={i} position={[x,0,0]}><boxGeometry args={[0.02,0.35,0.045]} /><a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} transparent opacity={0.6} /></mesh>
          ))}
        </group>
        {/* QR block */}
        <group position={[0.6, 0.4, 0.07]}>
          {[0,2,4,6,8].map(i => {
            const x = (i%3-1)*0.11, y = (Math.floor(i/3)-1)*0.11;
            return <mesh key={i} position={[x,y,0]}><boxGeometry args={[0.09,0.09,0.04]} /><a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} /></mesh>;
          })}
        </group>
        {/* Magnetic stripe */}
        <mesh position={[0,-1.4,0]}><boxGeometry args={[2.2,0.18,0.13]} /><meshPhysicalMaterial color="#f0f0f2" metalness={1} roughness={0.1} clearcoat={1} /></mesh>
        <mesh position={[0,-1.3,0]}><boxGeometry args={[2.2,0.06,0.14]} /><a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} transparent opacity={0.7} /></mesh>
        {/* Scan line */}
        {hovered && !disabled && (
          <mesh ref={scanRef} position={[0,0,0.07]}><boxGeometry args={[2.2,0.04,0.01]} /><meshBasicMaterial color={col} transparent opacity={0.7} /></mesh>
        )}
        {/* Icon */}
        <Text position={[0,-0.4,0.07]} fontSize={0.7} color={col} anchorX="center">{isCorrect ? '🔑' : '⚠'}</Text>
        <Text position={[0,1.1,0.07]} fontSize={0.22} color="#ffffff" anchorX="center" outlineWidth={0.005} outlineColor="#000000">{label}</Text>
        <Text position={[0,-1.0,0.07]} fontSize={0.14} color={col} anchorX="center">{sublabel}</Text>
        <Text position={[0,-1.72,0.07]} fontSize={0.11} color={hovered && !disabled ? col : 'rgba(255,255,255,0.25)'} anchorX="center">
          {isActive ? 'АУТЕНТИФИКАЦИЯ...' : disabled ? 'ЗАБЛОКИРОВАНО' : hovered ? '▶ АВТОРИЗАЦИЯ' : 'наведите для выбора'}
        </Text>
        </a.group>
      </a.group>
    </Float>
  );
}

/* ═══ SIGNATURE FLOW ═══ */
function SignatureFlow({ position, state }) {
  const col = state === 'success' ? '#00ff88' : state === 'error' ? '#ff3333' : '#aaaaaa';
  const steps = [
    { label: '📝 ДОКУМЕНТ',  sub: '"Выдать паспорт"', active: state !== 'idle' },
    { label: '🔑 ПОДПИСЬ', sub: 'Приватный Ключ',  active: state !== 'idle' && state !== 'idle' },
    { label: '📤 ПРОВЕРКА',  sub: 'Публичный Ключ',   active: state === 'success' || state === 'error' },
    { label: state === 'success' ? '🟢 УСПЕШНО' : state === 'error' ? '🔴 ОШИБКА' : '❓', sub: '', active: state === 'success' || state === 'error' },
  ];
  return (
    <group position={position}>
      <Text position={[0,1.2,0]} fontSize={0.11} color="#446" anchorX="center" letterSpacing={0.08}>ПРОЦЕСС АВТОРИЗАЦИИ С ПОМОЩЬЮ ЭЦП В E-GOV</Text>
      {steps.map((s,i) => (
        <group key={i} position={[(i-1.5)*1.65, 0, 0]}>
          <mesh><boxGeometry args={[1.5,0.8,0.1]} /><meshStandardMaterial color={s.active?'#0a0a20':'#050510'} metalness={0.8} /></mesh>
          <mesh><boxGeometry args={[1.52,0.82,0.12]} /><meshStandardMaterial color={s.active?col:'#111'} emissive={s.active?col:'#000'} emissiveIntensity={s.active?1.2:0} wireframe transparent opacity={0.45} depthWrite={false} /></mesh>
          <Text position={[0,0.12,0.06]} fontSize={0.1} color={s.active?col:'#333'} anchorX="center">{s.label}</Text>
          <Text position={[0,-0.12,0.06]} fontSize={0.07} color="#555" anchorX="center">{s.sub}</Text>
        </group>
      ))}
      {[-2,0,2].map((x,i) => (
        <mesh key={i} position={[x-0.75,0,0.08]} rotation={[0,0,-Math.PI/2]}>
          <coneGeometry args={[0.055,0.18,6]} />
          <meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.5} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══ MAIN SCENE 3 ═══ */
export default function Scene3() {
  const [state, setState] = useState('idle');
  const [activeKeyIndex, setActiveKeyIndex] = useState(null);

  const handleKey = (isCorrect, index) => {
    if (state !== 'idle') return;
    playClick(); playLaser();
    setState('scanning');
    setActiveKeyIndex(index);
    setTimeout(() => {
      if (isCorrect) { setState('success'); playUnlock(); playSuccess(); }
      else           { setState('error');   playError(); setTimeout(() => { setState('idle'); setActiveKeyIndex(null); }, 3000); }
    }, 2200);
  };

  const col = state === 'success' ? '#00ff88' : state === 'error' ? '#ff3333' : state === 'scanning' ? '#aaaaaa' : '#ffffff';

  return (
    <group position={[0, 2.5, 0]}>
      {/* Hexagonal floor */}
      <HexFloor radius={13} color={col} />

      {/* DNA helix in background */}
      <DNAHelix color1="#ffffff" color2="#aaaaaa" radius={9} height={22} />

      {/* Orbit particles */}
      <OrbitParticles count={200} radius={6.5} color={col} active={state !== 'idle'} />
      <OrbitParticles count={80}  radius={9.0} color="#aaaaaa" active />

      {/* Vault pedestal + vault — raised to be at eye-level from VR floor */}
      <VaultPedestal col={col} />
      <group position={[0, 3.5, 0]}>
        <HoloVault state={state} />
        <ScanBurst active={state === 'success' || state === 'error'} success={state === 'success'} />
      </group>

      {/* Security lasers — active when scanning */}
      <SecurityLasers active={state === 'scanning'} color={col} />

      {/* Top label — visible from VR at abs Y≈6.7m (overhead, decorative) */}
      <Text position={[0, 9.0, 0]} fontSize={0.28} color={col} anchorX="center" letterSpacing={0.08}>
        ЕДИНЫЙ АРХИВ ДАННЫХ (БЛОКЧЕЙН)
      </Text>

      {/* === INTERACTIVE PANEL — all at comfortable VR waist/eye zone === */}
      {/* Key type labels (abs Y≈3.8m — chest height) */}
      <group position={[0, 1.3, 5]}>
        <group position={[-5.5, 0, 0]}>
          <mesh position={[0, 0, -0.04]}><planeGeometry args={[3.5, 0.55]} /><meshBasicMaterial color="#ff3333" transparent opacity={0.14} /></mesh>
          <Text fontSize={0.2} color="#ff3333" anchorX="center" letterSpacing={0.06}>🔓 ЧУЖАЯ ЭЦП</Text>
        </group>
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0, -0.04]}><planeGeometry args={[3.5, 0.55]} /><meshBasicMaterial color="#ff3333" transparent opacity={0.14} /></mesh>
          <Text fontSize={0.2} color="#ff3333" anchorX="center" letterSpacing={0.06}>🔓 ИСТЕКШИЙ СЕРТИФИКАТ</Text>
        </group>
        <group position={[5.5, 0, 0]}>
          <mesh position={[0, 0, -0.04]}><planeGeometry args={[3.5, 0.55]} /><meshBasicMaterial color="#00ff88" transparent opacity={0.14} /></mesh>
          <Text fontSize={0.2} color="#00ff88" anchorX="center" letterSpacing={0.06}>🔑 ВАША ЭЦП</Text>
        </group>
      </group>

      {/* IIN / Public identifier bar (abs Y≈3.2m — eye level) */}
      <group position={[0, 0.7, 5]}>
        <mesh position={[0, 0, -0.06]}><planeGeometry args={[10, 0.7]} /><meshBasicMaterial color="#111" transparent opacity={0.65} /></mesh>
        <mesh position={[0, 0, -0.05]}><planeGeometry args={[10.06, 0.72]} /><meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.12} depthWrite={false} /></mesh>
        <Text position={[-4.2, 0, 0]} fontSize={0.19} color="#888888" anchorX="left" letterSpacing={0.04}>🌐 ПУБЛИЧНЫЙ ИИН (открыт всем):</Text>
        <Text position={[2.4, 0, 0]} fontSize={0.22} color="#ffffff" anchorX="left" letterSpacing={0.02}>901231301234</Text>
      </group>

      {/* Key cards (abs Y≈2.0–3.0m — natural reach zone) */}
      <KeyCard position={[-5.5, -0.5, 5]} label="ПОДДЕЛКА"    sublabel="Нет доступа"     isCorrect={false} onClick={(c) => handleKey(c, 0)} disabled={state!=='idle'} isActive={activeKeyIndex === 0} isHidden={activeKeyIndex !== null && activeKeyIndex !== 0} />
      <KeyCard position={[ 0.0, -0.5, 5]} label="ПРОСРОЧЕН"   sublabel="Отозванный ID"   isCorrect={false} onClick={(c) => handleKey(c, 1)} disabled={state!=='idle'} isActive={activeKeyIndex === 1} isHidden={activeKeyIndex !== null && activeKeyIndex !== 1} />
      <KeyCard position={[ 5.5, -0.5, 5]} label="ВАЛИДНАЯ ЭЦП" sublabel="Официальный ключ" isCorrect={true}  onClick={(c) => handleKey(c, 2)} disabled={state!=='idle'} isActive={activeKeyIndex === 2} isHidden={activeKeyIndex !== null && activeKeyIndex !== 2} />

      {/* Private key hint (abs Y≈0.9m — comfortably readable below cards) */}
      <Text position={[0, -1.6, 5]} fontSize={0.19} color="#555" anchorX="center" letterSpacing={0.04}>
        🔒 ПРИВАТНЫЙ КЛЮЧ ЭЦП: ••••••••••••••••••••••••••••••••  (СТРОГО СЕКРЕТЕН)
      </Text>

      {/* Signature flow (abs Y≈0.3m — at floor level, visible) */}
      <SignatureFlow position={[0, -2.2, 5]} state={state} />

      {/* Unlock button — abs Y=2.5-1.8=0.7m (above floor, reachable) */}
      {state === 'success' && (
        <MeshBtn
          position={[0, -1.8, 5]}
          label="🔒 ЗАБЛОКИРОВАТЬ СНОВА"
          color="#00ff88"
          onClick={() => { setState('idle'); setActiveKeyIndex(null); }}
          width={2.8}
        />
      )}
    </group>
  );
}
