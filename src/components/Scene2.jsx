import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Cylinder, Box, Torus, Sphere } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { playClick, playError, playSuccess, playChainBreak } from '../utils/audio';

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

/* Simple FNV-1a hash */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
function fancyHash(s) { return `0x${hashStr(s)}`; }
function shortHash(s) { const h = hashStr(s); return `${h.slice(0, 4)}…${h.slice(-4)}`; }

/* Massive Volumetric Energy Beam connecting pillars */
function EnergyBeam({ startPos, endPos, valid }) {
  const mid = useMemo(() => [(startPos[0] + endPos[0]) / 2, (startPos[1] + endPos[1]) / 2, (startPos[2] + endPos[2]) / 2], [startPos, endPos]);
  const distance = useMemo(() => new THREE.Vector3(...startPos).distanceTo(new THREE.Vector3(...endPos)), [startPos, endPos]);
  const angle = useMemo(() => Math.atan2(endPos[0] - startPos[0], endPos[2] - startPos[2]), [startPos, endPos]);
  
  const color = valid ? '#00ff88' : '#ff2a2a';
  const beamRef = useRef();
  
  useFrame(({ clock }) => {
    if (beamRef.current) {
      beamRef.current.rotation.y = clock.elapsedTime * (valid ? -1.5 : 5);
      if (!valid) beamRef.current.position.x = mid[0] + (Math.random() - 0.5) * 0.1;
    }
  });

  return (
    <group position={mid} rotation={[0, angle, Math.PI / 2]}>
      {/* Core Beam */}
      <Cylinder args={[0.08, 0.08, distance, 12]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={valid ? 4 : 8} />
      </Cylinder>
      {/* Outer Glow */}
      <Cylinder args={[0.3, 0.3, distance, 16]} rotation={[0, 0, Math.PI / 2]}>
        <meshBasicMaterial color={color} transparent opacity={valid ? 0.15 : 0.4} />
      </Cylinder>
      {/* Spinning energy rings */}
      <group ref={beamRef}>
        <Cylinder args={[0.4, 0.4, distance, 6]} rotation={[0, 0, Math.PI / 2]}>
          <meshBasicMaterial color={color} wireframe transparent opacity={valid ? 0.3 : 0.8} depthWrite={false} />
        </Cylinder>
      </group>
    </group>
  );
}

/* ═══ BLOCK PEDESTAL ═══ */
function BlockPedestal({ position, rotation, color }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, -3.8, 0]}>
        <cylinderGeometry args={[2.2, 2.6, 0.25, 8]} />
        <meshPhysicalMaterial color="#070710" metalness={0.98} roughness={0.04} clearcoat={1} />
      </mesh>
      <mesh position={[0, -3.66, 0]}>
        <cylinderGeometry args={[2.25, 2.25, 0.04, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, -3.42, 0]}>
        <cylinderGeometry args={[1.7, 2.0, 0.2, 8]} />
        <meshPhysicalMaterial color="#080812" metalness={0.96} roughness={0.05} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, -3.3, 0]}>
        <cylinderGeometry args={[1.72, 1.72, 0.04, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, -2.2, 0]}>
        <cylinderGeometry args={[1.2, 1.5, 2.2, 8]} />
        <meshPhysicalMaterial color="#090914" metalness={0.97} roughness={0.05} clearcoat={1} />
      </mesh>
      <mesh position={[0, -1.07, 0]}>
        <cylinderGeometry args={[1.22, 1.22, 0.05, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(ang) * 1.9, -3.3, Math.sin(ang) * 1.9]}>
            <mesh><cylinderGeometry args={[0.05, 0.05, 0.8, 6]} /><meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={1.5} metalness={1} roughness={0} /></mesh>
            <mesh position={[0, 0.45, 0]}><sphereGeometry args={[0.06, 8, 8]} /><meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={4} metalness={1} roughness={0} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ═══ CHAIN FLOOR ═══ */
function ChainFloor() {
  const glowRef = useRef();
  useFrame(({ clock }) => {
    if (glowRef.current) glowRef.current.material.opacity = 0.025 + Math.sin(clock.elapsedTime * 0.6) * 0.012;
  });
  return (
    <group position={[0, -0.15, -4]}>
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[30, 16]} />
        <meshPhysicalMaterial color="#060610" metalness={0.98} roughness={0.04} />
      </mesh>
      <mesh ref={glowRef} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[30, 16, 30, 16]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.025} depthWrite={false} />
      </mesh>
      {[-6, -2, 2, 6].map((z, i) => (
        <mesh key={`hz-${i}`} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, z]}>
          <planeGeometry args={[28, 0.018]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
        </mesh>
      ))}
      {[-12, -7, -2, 3, 8, 13].map((x, i) => (
        <mesh key={`vt-${i}`} rotation={[-Math.PI/2, 0, 0]} position={[x, 0.02, 0]}>
          <planeGeometry args={[0.018, 14]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
        </mesh>
      ))}
    </group>
  );
}

/* Holographic Data Pillar (Replaces flat blocks) */

function DataPillar({ index, tx, prevHash, valid, tampered, onModify, onReset, position, rotation }) {
  const color = valid ? '#00ff88' : '#ff2a2a';
  
  const { coreEm, shellY } = useSpring({ 
    coreEm: valid ? 2 : 8, 
    shellY: valid ? 0 : 0.2,
    config: { tension: 120, friction: 14 } 
  });

  const coreRef = useRef();
  const ringsRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (coreRef.current) {
      coreRef.current.rotation.y = t * (valid ? 1.2 : 5);
      coreRef.current.position.y = Math.sin(t * 2 + index) * 0.1;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
      ringsRef.current.rotation.y = -t * 0.8;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Outer Glass Shell */}
      <a.group position-y={shellY}>
        <Box args={[2.8, 6.5, 2.8]} raycast={() => null}>
          <meshPhysicalMaterial 
            color="#050505" 
            transparent 
            opacity={0.7} 
            roughness={0.1} 
            metalness={0.5} 
            wireframe={!valid}
          />
        </Box>
        {/* Wireframe Frame */}
        <Box args={[2.85, 6.55, 2.85]} raycast={() => null}>
          <meshBasicMaterial color={color} wireframe transparent opacity={0.3} depthWrite={false} />
        </Box>
      </a.group>

      {/* Internal Spinning Data Core */}
      <group ref={coreRef}>
        <mesh>
          <icosahedronGeometry args={[0.5 * 0.95, 2]} />
          <a.meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={coreEm}
            metalness={1}
            roughness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={2}
          />
        </mesh>
        {/* Floating Rings around core */}
        <group ref={ringsRef}>
          {[1.5, 0, -1.5].map((y, i) => (
            <Torus key={i} args={[0.9, 0.05, 16, 32]} position={[0, y, 0]} rotation={[Math.PI/2, 0, 0]}>
              <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={4} clearcoat={1} metalness={1} roughness={0} />
            </Torus>
          ))}
        </group>
      </group>

      {/* Base & Top caps */}
      <Cylinder args={[1.5, 1.8, 0.5, 8]} position={[0, -3.5, 0]} raycast={null}>
        <meshPhysicalMaterial color="#f5f5f7" metalness={1} roughness={0.1} clearcoat={1} />
      </Cylinder>
      <Cylinder args={[1.5, 1.5, 0.1, 8]} position={[0, -3.25, 0]} raycast={null}>
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={5} metalness={1} roughness={0} />
      </Cylinder>
      
      {/* Holographic Data Screen attached to pillar front */}
      <group position={[0, 0, 1.6]}>
        <mesh position={[0, 0, -0.05]} raycast={null}>
          <planeGeometry args={[2.6, 4]} />
          <meshBasicMaterial color="#050505" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0, -0.04]} raycast={null}>
          <planeGeometry args={[2.65, 4.05]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.6} depthWrite={false} />
        </mesh>
        
        <Text position={[0, 1.6, 0]} fontSize={0.3} color="#ffffff" anchorX="center" letterSpacing={0.1} outlineWidth={0.015} outlineColor="#000000">
          ГОС-БЛОК #{index}
        </Text>
        <Text position={[0, 1.1, 0]} fontSize={0.1} color={color} anchorX="center" letterSpacing={0.1} outlineWidth={0.01} outlineColor="#000000">
          ПРЕДЫДУЩИЙ ХЭШ
        </Text>
        <Text position={[0, 0.8, 0]} fontSize={0.2} color="#dddddd" anchorX="center" outlineWidth={0.015} outlineColor="#000000">
          {prevHash}
        </Text>
        
        <Text position={[0, 0.2, 0]} fontSize={0.1} color={color} anchorX="center" letterSpacing={0.1} outlineWidth={0.01} outlineColor="#000000">
          ГОСУДАРСТВЕННАЯ ЗАПИСЬ
        </Text>
        <Text position={[0, -0.15, 0]} fontSize={0.22} color={tampered ? '#ff4444' : '#fff'} anchorX="center" maxWidth={2.4} outlineWidth={0.015} outlineColor="#000000">
          {tx}
        </Text>

        <Text position={[0, -0.7, 0]} fontSize={0.1} color={color} anchorX="center" letterSpacing={0.1} outlineWidth={0.01} outlineColor="#000000">
          ХЭШ БЛОКА
        </Text>
        <Text position={[0, -1.0, 0]} fontSize={0.22} color="#cccccc" anchorX="center">
          {fancyHash(tx + prevHash)}
        </Text>

        <Text position={[0, -1.6, 0]} fontSize={0.25} color={color} anchorX="center">
          {valid ? '🟢 ЗАПИСЬ ВАЛИДНА' : '🔴 ДАННЫЕ ПОВРЕЖДЕНЫ'}
        </Text>

        {/* Interactive Buttons */}
        <group position={[0, -2.5, 0]}>
          <MeshBtn 
            position={tampered ? [-0.8, 0, 0] : [0, 0, 0]} 
            label={tampered ? '🔓 ВЗЛОМАНО' : '✏ ИЗМЕНИТЬ ДАННЫЕ'} 
            color={tampered ? '#ff3333' : '#00aaff'} 
            onClick={onModify} 
            width={1.6} 
          />
          {tampered && (
            <MeshBtn 
              position={[0.9, 0, 0]} 
              label="↺ ВОССТАНОВИТЬ" 
              color="#00ff88" 
              onClick={onReset} 
              width={1.4} 
            />
          )}
        </group>
      </group>
    </group>
  );
}

export default function Scene2() {
  const origTx = ['ID:402 Право собственности', 'ID:811 Лицензия на бизнес', 'ID:105 Налоговый платеж', 'ID:992 Учтенный голос'];
  const [txs, setTxs] = useState([...origTx]);
  const hackMsg = '⚠ НЕСАНКЦИОНИРОВАННОЕ ИЗМЕНЕНИЕ';

  const h0     = '00000000';
  const h1Orig = hashStr(origTx[0] + h0);
  const h2Orig = hashStr(origTx[1] + h1Orig);
  const h3Orig = hashStr(origTx[2] + h2Orig);

  const tampered = txs.map((t, i) => t !== origTx[i]);
  const curH1    = hashStr(txs[0] + h0);
  const v1 = true;
  const v2 = curH1 === h1Orig;
  const v3 = v2 && hashStr(txs[1] + h1Orig) === h2Orig;
  const v4 = v3 && hashStr(txs[2] + h2Orig) === h3Orig;
  const valids = [v1, v2, v3, v4];
  const anyTampered = tampered.some(Boolean);

  const modify  = (idx) => { playChainBreak(); setTxs(p => { const n=[...p]; n[idx]=hackMsg; return n; }); };
  const restore = (idx) => { playSuccess();    setTxs(p => { const n=[...p]; n[idx]=origTx[idx]; return n; }); };
  const restoreAll = () => { playSuccess(); setTxs([...origTx]); };

  // Широкая дуга вокруг пользователя, пилоны стоят на полу
  const pillars = [
    { pos: [-11, 3.5, -3], rot: [0, 0.5, 0] },
    { pos: [-3.7, 3.5, -6], rot: [0, 0.18, 0] },
    { pos: [3.7, 3.5, -6],  rot: [0, -0.18, 0] },
    { pos: [11, 3.5, -3],  rot: [0, -0.5, 0] }
  ];
  
  const prevHashList = [h0, h1Orig, h2Orig, h3Orig];

  return (
    <group position={[0, 0.2, 0]}>
      
      {/* Energy Beams connecting the pillars */}
      <EnergyBeam startPos={[-11, 3.5, -3]} endPos={[-3.7, 3.5, -6]} valid={v2} />
      <EnergyBeam startPos={[-3.7, 3.5, -6]} endPos={[3.7, 3.5, -6]} valid={v3} />
      <EnergyBeam startPos={[3.7, 3.5, -6]} endPos={[11, 3.5, -3]} valid={v4} />

      {/* 4 Massive Data Pillars + their pedestals */}
      {pillars.map((p, i) => (
        <group key={i}>
          <BlockPedestal position={p.pos} rotation={p.rot} color={valids[i] ? '#00ff88' : '#ff2a2a'} />
          <DataPillar
            index={i+1} tx={txs[i]} prevHash={prevHashList[i]}
            valid={valids[i]} tampered={tampered[i]}
            onModify={() => modify(i)} onReset={() => restore(i)}
            position={p.pos} rotation={p.rot}
          />
        </group>
      ))}

      {/* Center Hologram status */}
      <group position={[0, 1.5, -2]}>
        <Text position={[0, 0, 0]} fontSize={0.8} color={anyTampered ? '#ff2a2a' : '#00ff88'} anchorX="center" letterSpacing={0.1}>
          {anyTampered ? '🔴 СЕТЬ СКОМПРОМЕТИРОВАНА' : '🟢 ЦЕЛОСТНОСТЬ ЦЕПИ: ПОДТВЕРЖДЕНА'}
        </Text>
        {anyTampered && (
          <Text position={[0, -1, 0]} fontSize={0.3} color="#ff5555" anchorX="center">
            КРИТИЧЕСКАЯ ОШИБКА: ОБНАРУЖЕН ЭФФЕКТ ЛАВИНЫ
          </Text>
        )}
      </group>

      {/* Global Restore */}
      {anyTampered && (
        <MeshBtn
          position={[0, 9.0, -4]}
          label="🔄 ПЕРЕЗАГРУЗИТЬ И ВОССТАНОВИТЬ ЦЕПЬ"
          color="#00ff88"
          onClick={restoreAll}
          width={4.2}
        />
      )}

      {/* Premium chain floor */}
      <ChainFloor />
    </group>
  );
}
