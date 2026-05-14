import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, Html } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { playClick, playError, playSuccess, playTxSend, playTxArrive } from '../utils/audio';

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

/* ═══ CIRCUIT PLATFORM ═══ */
function CircuitPlatform({ radius = 4, color = '#ffffff', sides = 8 }) {
  const glowRef = useRef();
  useFrame(({ clock }) => {
    if (glowRef.current) glowRef.current.material.opacity = 0.06 + Math.sin(clock.elapsedTime * 0.8) * 0.03;
  });
  return (
    <group>
      {/* Dark metal base */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.12, 0]}>
        <circleGeometry args={[radius, sides]} />
        <meshPhysicalMaterial color="#060610" metalness={0.98} roughness={0.04} />
      </mesh>
      {/* Wireframe overlay */}
      <mesh ref={glowRef} rotation={[-Math.PI/2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[radius, sides]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.07} depthWrite={false} />
      </mesh>
      {/* Concentric glow rings */}
      {[radius * 0.35, radius * 0.65, radius * 0.9, radius].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI/2, 0, 0]} position={[0, -0.08 + i * 0.004, 0]}>
          <ringGeometry args={[r - 0.02, r, sides * 3]} />
          <meshBasicMaterial color={color} transparent opacity={i === 3 ? 0.5 : 0.15} />
        </mesh>
      ))}
      {/* Corner marker dots */}
      {Array.from({ length: sides }, (_, i) => {
        const ang = (i / sides) * Math.PI * 2;
        return (
          <mesh key={`dot-${i}`} position={[Math.cos(ang) * (radius - 0.18), -0.05, Math.sin(ang) * (radius - 0.18)]}>
            <cylinderGeometry args={[0.05, 0.05, 0.07, 6]} />
            <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={2} metalness={1} roughness={0} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══ HOLO TOWER (premium building) ═══ */
function HoloTower({ x, z, height, width, depth, active, isServer, color }) {
  const emCol = active ? color : '#ff2244';
  const lobbyH = Math.min(height * 0.2, 0.85);
  const towerH = height - lobbyH;
  const towerY = lobbyH / 2 + towerH / 2;
  return (
    <group position={[x, 0, z]}>
      {/* Lobby base — wider */}
      <mesh position={[0, lobbyH / 2, 0]}>
        <boxGeometry args={[width * 1.35, lobbyH, depth * 1.35]} />
        <meshPhysicalMaterial color="#09090f" metalness={0.95} roughness={0.1} clearcoat={0.6} />
      </mesh>
      {/* Tower body */}
      <mesh position={[0, towerY, 0]}>
        <boxGeometry args={[width, towerH, depth]} />
        <meshPhysicalMaterial color="#08080e" emissive={emCol} emissiveIntensity={active ? 0.06 : 0.02} metalness={0.88} roughness={0.15} />
      </mesh>
      {/* Front window grid */}
      <mesh position={[0, towerY, depth / 2 + 0.012]}>
        <planeGeometry args={[width * 0.86, towerH * 0.88]} />
        <meshBasicMaterial color={emCol} wireframe transparent opacity={active ? 0.28 : 0.05} depthWrite={false} />
      </mesh>
      {/* Side window grid */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[width / 2 + 0.012, towerY, 0]}>
        <planeGeometry args={[depth * 0.86, towerH * 0.88]} />
        <meshBasicMaterial color={emCol} wireframe transparent opacity={active ? 0.2 : 0.04} depthWrite={false} />
      </mesh>
      {/* Corner LED strips */}
      {[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz], i) => (
        <mesh key={i} position={[sx * width / 2, towerY, sz * depth / 2]}>
          <boxGeometry args={[0.022, towerH, 0.022]} />
          <meshPhysicalMaterial color={emCol} emissive={emCol} emissiveIntensity={active ? 2 : 0.2} metalness={1} roughness={0} />
        </mesh>
      ))}
      {/* Rooftop LED */}
      <mesh position={[0, towerY + towerH / 2 + 0.035, 0]}>
        <boxGeometry args={[width, 0.045, depth]} />
        <meshPhysicalMaterial color={emCol} emissive={emCol} emissiveIntensity={active ? 4 : 0.3} metalness={1} roughness={0} />
      </mesh>
      {/* Server antenna */}
      {isServer && (
        <group position={[0, towerY + towerH / 2, 0]}>
          <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.022, 0.022, 1.1, 6]} /><meshPhysicalMaterial color="#aaaaaa" metalness={1} roughness={0.1} /></mesh>
          <mesh position={[0, 1.12, 0]}><sphereGeometry args={[0.07, 8, 8]} /><meshPhysicalMaterial color={emCol} emissive={emCol} emissiveIntensity={active ? 5 : 0.5} metalness={1} roughness={0} /></mesh>
          <mesh position={[0.1, 0.65, 0]} rotation={[0, 0, -Math.PI/5]}><cylinderGeometry args={[0.2, 0.02, 0.06, 10]} /><meshPhysicalMaterial color="#888888" metalness={0.9} roughness={0.2} /></mesh>
        </group>
      )}
      {/* Vertical light beam under building */}
      {active && (
        <mesh position={[0, -height / 4, 0]}>
          <cylinderGeometry args={[0.018, 0.018, height / 2, 6]} />
          <meshBasicMaterial color={emCol} transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}

/* ═══ DIGITAL CITY BUILDINGS ═══ */
function CityBuildings({ serverOn, ddos, nodes, decentralized, nodePos }) {
  const platformY = -3.5;
  const color = decentralized ? '#00ff88' : '#ffffff';

  const buildings = useMemo(() => {
    if (decentralized) {
      return nodePos.map((pos, i) => ({
        x: pos[0], z: 0,
        w: 0.34 + Math.abs(Math.sin(i * 7.3)) * 0.14,
        h: pos[1] - platformY,
        d: 0.34 + Math.abs(Math.sin(i * 4.1)) * 0.12,
        nodeIdx: i, isServer: false,
      }));
    }
    return [
      { x: 0, z: 0, w: 0.75, h: 0 - platformY, d: 0.75, nodeIdx: -1, isServer: true },
      ...nodePos.map((pos, i) => ({
        x: pos[0], z: 0, w: 0.3, h: pos[1] - platformY, d: 0.3, nodeIdx: i, isServer: false,
      })),
    ];
  }, [decentralized, nodePos, platformY]);

  return (
    <group position={[0, platformY, -0.2]}>
      <CircuitPlatform radius={decentralized ? 3.9 : 3.6} color={color} sides={decentralized ? 8 : 6} />
      {buildings.map((b, i) => {
        const isNodeAlive = nodes && b.nodeIdx >= 0 ? nodes[b.nodeIdx] : true;
        const isAlive = decentralized
          ? isNodeAlive
          : (b.nodeIdx === -1 ? (serverOn && !ddos) : (serverOn && !ddos && isNodeAlive));
        return (
          <HoloTower key={i}
            x={b.x} z={b.z}
            height={b.h} width={b.w} depth={b.d}
            active={isAlive} isServer={b.isServer} color={color}
          />
        );
      })}
    </group>
  );
}

/* BFS */
function findPath(adj, from, to, active) {
  if (!active[from] || !active[to]) return null;
  const visited = new Set([from]);
  const parent = {};
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) {
      const p = []; let c = to;
      while (c !== undefined) { p.unshift(c); c = parent[c]; }
      return p;
    }
    for (const n of (adj[cur] || [])) {
      if (!visited.has(n) && active[n]) { visited.add(n); parent[n] = cur; queue.push(n); }
    }
  }
  return null;
}


/* TX packet */
function TxPacket({ id, path, color, onDone, duration = 1.0 }) {
  const ref   = useRef();
  const start = useRef(null);
  const done  = useRef(false);
  const segs  = path.length - 1;

  useFrame(({ clock }) => {
    if (!ref.current || segs < 1 || done.current) return;
    if (start.current === null) start.current = clock.elapsedTime;
    const progress = Math.min((clock.elapsedTime - start.current) / duration, 1);
    const si = Math.min(Math.floor(progress * segs), segs - 1);
    const sp = progress * segs - si;
    ref.current.position.lerpVectors(
      new THREE.Vector3(...path[si]),
      new THREE.Vector3(...path[si + 1]),
      sp
    );
    ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 14) * 0.25);
    if (progress >= 1 && !done.current) { done.current = true; onDone(id); }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.12, 10, 10]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={8} />
    </mesh>
  );
}

/* Burst effect */
function Burst({ position, color, type }) {
  const ref   = useRef();
  const start = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (start.current === null) start.current = clock.elapsedTime;
    const t = clock.elapsedTime - start.current;
    ref.current.scale.setScalar(1 + t * 5);
    ref.current.material.opacity = Math.max(0, 1 - t * 2.5);
    if (t > 0.7) ref.current.visible = false;
  });
  return (
    <mesh ref={ref} position={position} rotation={type === 'success' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
      {type === 'success'
        ? <torusGeometry args={[0.2, 0.035, 8, 24]} />
        : <octahedronGeometry args={[0.2, 0]} />}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} transparent opacity={1} />
    </mesh>
  );
}

/* Network Node — lightweight */
/* ═══ NETWORK NODE — holographic ═══ */
function NetNode({ position, active, isCenter, onClick, label, sublabel }) {
  const col  = active ? (isCenter ? '#ffffff' : '#aaaaaa') : '#ff2244';
  const col2 = active ? (isCenter ? '#00ff88' : '#bbbbbb') : '#ff5555';
  const sz   = isCenter ? 0.35 : 0.2; // Reduced size to match buildings
  const coreRef = useRef(), r1 = useRef(), r2 = useRef(), glowRef = useRef();
  
  // Drastically reduced emissiveIntensity so they don't look like huge blobs with Bloom
  const { emI, sc } = useSpring({ 
    emI: active ? (isCenter ? 1.5 : 0.8) : 0.3, 
    sc: active ? 1 : 0.7, 
    config: { tension: 130, friction: 18 } 
  });

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (coreRef.current && active) coreRef.current.rotation.y = t * (isCenter ? 0.9 : 1.2);
    if (r1.current)  r1.current.rotation.z = t * (isCenter ? 0.65 : 0.9);
    if (r2.current)  r2.current.rotation.z = -t * (isCenter ? 0.45 : 0.65); r2.current && (r2.current.rotation.x = t * 0.3);
    if (glowRef.current) glowRef.current.material.opacity = active ? 0.05 + Math.sin(t * 2.2 + position[0]) * 0.03 : 0;
  });

  return (
    <a.group position={position} scale={sc} onPointerDown={e => { e.stopPropagation(); playClick(); onClick(); }}>
      {/* Outer glow */}
      <mesh ref={glowRef}><sphereGeometry args={[sz * 2.2, 14, 14]} /><meshBasicMaterial color={col} transparent opacity={0.07} side={THREE.BackSide} /></mesh>
      
      {/* Node Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[sz, 1]} />
        <a.meshPhysicalMaterial
          color={col}
          emissive={col}
          emissiveIntensity={emI}
          metalness={1}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2}
        />
      </mesh>

      {/* Glass Shell */}
      <mesh>
        <icosahedronGeometry args={[sz * 1.3, 1]} />
        <a.meshPhysicalMaterial
          color="#ffffff"
          transmission={0.9}
          thickness={0.5}
          ior={1.5}
          roughness={0.1}
          transparent opacity={0.6}
        />
      </mesh>

      {/* Orbit rings */}
      {active && (
        <>
          <group ref={r1}><mesh><torusGeometry args={[sz + 0.18, 0.014, 8, 40]} />
            <a.meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={emI} transparent opacity={0.6} /></mesh></group>
          <group ref={r2} rotation={[Math.PI/2.4, 0, 0]}><mesh><torusGeometry args={[sz + 0.1, 0.009, 7, 28]} />
            <a.meshPhysicalMaterial color={col2} emissive={col2} emissiveIntensity={emI} transparent opacity={0.4} /></mesh></group>
        </>
      )}
      {/* Center server detail */}
      {isCenter && (
        <group position={[0, 0, sz + 0.06]}>
          {[-0.14, 0.14].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}><boxGeometry args={[sz * 0.9, 0.04, 0.025]} />
              <meshPhysicalMaterial color={active ? '#ffffff' : '#ff3333'} emissive={active ? '#ffffff' : '#ff3333'} emissiveIntensity={5} />
            </mesh>
          ))}
        </group>
      )}
      <Text position={[0, sz + 0.38, 0]} fontSize={0.14} color="#ffffff" anchorX="center" outlineWidth={0.004} outlineColor="#000000">{label}</Text>
      {sublabel && <Text position={[0, -(sz + 0.28), 0]} fontSize={0.1} color={col} anchorX="center">{sublabel}</Text>}
    </a.group>
  );
}

/* ═══ EDGE — animated data flow ═══ */
function Edge({ from, to, active, highlighted }) {
  const pts  = useMemo(() => [new THREE.Vector3(...from), new THREE.Vector3(...to)], [from.join(), to.join()]);
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts]);
  const flowRef = useRef();
  const baseColor = highlighted ? '#00ff88' : active ? '#555555' : '#222222';
  const baseOp    = highlighted ? 0.9 : active ? 0.5 : 0.1;

  useFrame(({ clock }) => {
    if (!flowRef.current || !highlighted) return;
    const t = (clock.elapsedTime * 1.8) % 1;
    const s = new THREE.Vector3(...from);
    const e = new THREE.Vector3(...to);
    flowRef.current.position.lerpVectors(s, e, t);
    flowRef.current.material.opacity = Math.sin(t * Math.PI) * 0.9;
  });

  return (
    <group>
      <line geometry={geom}><lineBasicMaterial color={baseColor} transparent opacity={baseOp} /></line>
      {highlighted && (
        <mesh ref={flowRef}><sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

/* ════════════════════════════
   CENTRALIZED NETWORK
════════════════════════════ */
function CentralizedNet({ position }) {
  const [serverOn, setServerOn] = useState(true);
  const [nodes, setNodes]       = useState(Array(6).fill(true));
  const [txs, setTxs]           = useState([]);
  const [effects, setEffects]   = useState([]);
  const [stats, setStats]       = useState({ ok: 0, fail: 0 });
  const [ddos, setDdos]         = useState(false);
  const [latency, setLatency]   = useState(120);
  const idRef = useRef(0);
  const R = 2.7;
  const names = ['НАЛОГИ', 'ПОЛИЦИЯ', 'КАДАСТР', 'МИНЗДРАВ', 'ТАМОЖНЯ', 'ВЫБОРЫ'];
  const srvPos = [0, 0, 0];

  const nodePos = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const ang = (i / 6) * Math.PI * 2;
    return [Math.cos(ang) * R, Math.sin(ang) * R, 0];
  }), []);

  useEffect(() => {
    const iv = setInterval(() => {
      if (txs.length >= (ddos ? 8 : 3)) return;
      if (!serverOn && !ddos) return; // If central server is off, the whole system halts

      const from = Math.floor(Math.random() * 6);
      if (!nodes[from]) return; // Offline node is completely silent

      let to = Math.floor(Math.random() * 6);
      while (to === from) to = Math.floor(Math.random() * 6);
      
      const ok = serverOn && nodes[to] && !ddos;
      idRef.current++;
      const txId = idRef.current;
      
      setLatency(serverOn && !ddos ? 80 + Math.floor(Math.random() * 80) : 9999);
      const path = [nodePos[from], srvPos, ...(ok ? [nodePos[to]] : [])];
      playTxSend();
      setTxs(p => [...p, { id: txId, path, color: ok ? '#00ff88' : '#888888', ok, dest: nodePos[to] }]);
    }, ddos ? 200 : 900);
    return () => clearInterval(iv);
  }, [txs.length, serverOn, nodes, ddos]);

  const handleDone = (txId) => {
    setTxs(p => {
      const tx = p.find(t => t.id === txId);
      if (tx) {
        const effectId = Date.now() + Math.random();
        if (tx.ok) { setEffects(pr => [...pr, { id: effectId, type: 'success', pos: tx.dest, color: '#00ff88' }]); setStats(pr => ({ ...pr, ok: pr.ok + 1 })); playTxArrive(); }
        else { setEffects(pr => [...pr, { id: effectId, type: 'fail', pos: srvPos, color: '#ff3333' }]); setStats(pr => ({ ...pr, fail: pr.fail + 1 })); }
      }
      return p.filter(t => t.id !== txId);
    });
  };

  useEffect(() => {
    if (!effects.length) return;
    const t = setTimeout(() => setEffects(p => p.slice(1)), 700);
    return () => clearTimeout(t);
  }, [effects]);

  const pct   = stats.ok + stats.fail > 0 ? Math.round(stats.ok / (stats.ok + stats.fail) * 100) : 100;
  const col   = serverOn && !ddos ? '#ffffff' : '#ff3333';

  return (
    <group position={position}>
      <Text position={[0, 4.6, 0]} fontSize={0.38} color="#ffffff" anchorX="center" outlineWidth={0.005} outlineColor="#000000" letterSpacing={0.08}>ДАТА-ЦЕНТР E-GOV</Text>
      <Text position={[0, 4.15, 0]} fontSize={0.12} color="#888888" anchorX="center">Централизованная Гос. Архитектура</Text>

      <NetNode position={srvPos} active={serverOn && !ddos} isCenter
        onClick={() => { setServerOn(v => !v); serverOn ? playError() : playSuccess(); }}
        label="СЕРВЕР" sublabel={ddos ? '🔥 DDoS' : serverOn ? 'выключить' : '⚠ ОТКЛЮЧЕН'} />

      {nodePos.map((p, i) => {
        const act = serverOn && nodes[i] && !ddos;
        return (
          <group key={`node-${i}`}>
            <Edge from={srvPos} to={p} active={act} />
            <NetNode position={p} active={nodes[i]}
              onClick={() => setNodes(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
              label={names[i]} sublabel={nodes[i] ? undefined : '✕'} />
          </group>
        );
      })}

      {txs.map(tx => <TxPacket key={`tx-${tx.id}`} id={tx.id} path={tx.path} color={tx.color} onDone={handleDone} duration={tx.ok ? 0.9 : 0.5} />)}
      {effects.map(e => <Burst key={`eff-${e.id}`} position={e.pos} color={e.color} type={e.type} />)}

      <CityBuildings serverOn={serverOn} ddos={ddos} decentralized={false} nodes={nodes} nodePos={nodePos} />

      <Text position={[0, -4.0, 0]} fontSize={0.18} color={col} anchorX="center">
        {ddos ? '🔴 DDoS АТАКА' : serverOn ? `🟢 В СЕТИ · ${latency}мс` : '🔴 ОТКЛЮЧЕН'}
      </Text>
      
      <MeshBtn 
        position={[0, -4.7, 0]} 
        label={ddos ? '🛑 ОСТАНОВИТЬ DDoS' : '⚡ СИМУЛЯЦИЯ DDoS'} 
        color={ddos ? '#ff3333' : '#ff9500'} 
        onClick={() => setDdos(v => !v)} 
        width={1.6} 
      />
    </group>
  );
}

/* ════════════════════════════
   DECENTRALIZED NETWORK
════════════════════════════ */
function DecentralizedNet({ position }) {
  const N = 8;
  const [nodes, setNodes]     = useState(Array(N).fill(true));
  const [txs, setTxs]         = useState([]);
  const [hlEdges, setHlEdges] = useState(new Set());
  const [effects, setEffects] = useState([]);
  const [stats, setStats]     = useState({ ok: 0, fail: 0 });
  const idRef = useRef(0);
  const R = 2.9;
  const names = ['АКИМАТ', 'ЦОН', 'E-GOV', 'TENGRI', 'ОТБАСЫ', 'КЫЗМЕТ', 'АШЫК', 'ХАЛЫК'];

  const nodePos = useMemo(() => Array.from({ length: N }, (_, i) => {
    const ang = (i / N) * Math.PI * 2;
    return [Math.cos(ang) * R, Math.sin(ang) * R, 0];
  }), []);

  const edges = useMemo(() => {
    const e = [];
    for (let i = 0; i < N; i++) {
      e.push([i, (i + 1) % N]);
      e.push([i, (i + 2) % N]);
      e.push([i, (i + 3) % N]);
    }
    return [...new Set(e.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`))].map(s => s.split('-').map(Number));
  }, []);

  const adj = useMemo(() => {
    const a = Array.from({ length: N }, () => []);
    for (const [u, v] of edges) { a[u].push(v); a[v].push(u); }
    return a;
  }, [edges]);

  const activeCount = nodes.filter(Boolean).length;
  const healthPct   = Math.round((activeCount / N) * 100);
  const isConnected = useMemo(() => {
    const actives = nodes.map((v, i) => v ? i : -1).filter(i => i >= 0);
    if (actives.length <= 1) return actives.length === 1;
    const visited = new Set([actives[0]]);
    const queue   = [actives[0]];
    while (queue.length) {
      const cur = queue.shift();
      for (const n of adj[cur]) { if (!visited.has(n) && nodes[n]) { visited.add(n); queue.push(n); } }
    }
    return visited.size === actives.length;
  }, [nodes, adj]);

  useEffect(() => {
    const iv = setInterval(() => {
      if (txs.length >= 4) return;
      
      const from = Math.floor(Math.random() * N);
      if (!nodes[from]) return; // Offline node is completely silent

      let to = Math.floor(Math.random() * N);
      while (to === from) to = Math.floor(Math.random() * N);
      if (!nodes[to]) return; // For visual clarity, don't try to send to an offline node either
      
      idRef.current++;
      const txId = idRef.current;
      const path = findPath(adj, from, to, nodes);
      if (!path) {
        // If there's no path (network split), the active node fails to send
        setEffects(p => [...p, { id: txId, type: 'fail', pos: nodePos[from], color: '#ff2244' }]);
        setStats(p => ({ ...p, fail: p.fail + 1 }));
        return;
      }
      const edgeKeys = new Set();
      for (let i = 0; i < path.length - 1; i++) edgeKeys.add(`${Math.min(path[i], path[i+1])}-${Math.max(path[i], path[i+1])}`);
      setHlEdges(prev => new Set([...prev, ...edgeKeys]));
      playTxSend();
      setTxs(p => [...p, { id: txId, path: path.map(i => nodePos[i]), color: '#00ff88', dest: nodePos[to], edgeKeys, hops: path.length - 1 }]);
    }, 900);
    return () => clearInterval(iv);
  }, [txs.length, nodes, adj]);

  const handleDone = (txId) => {
    setTxs(p => {
      const tx = p.find(t => t.id === txId);
      if (tx) {
        const effectId = Date.now() + Math.random();
        setEffects(pr => [...pr, { id: effectId, type: 'success', pos: tx.dest, color: '#00ff88' }]);
        setStats(pr => ({ ...pr, ok: pr.ok + 1 }));
        playTxArrive();
        setHlEdges(prev => { const next = new Set(prev); for (const k of tx.edgeKeys) next.delete(k); return next; });
      }
      return p.filter(t => t.id !== txId);
    });
  };

  useEffect(() => {
    if (!effects.length) return;
    const t = setTimeout(() => setEffects(p => p.slice(1)), 700);
    return () => clearTimeout(t);
  }, [effects]);

  const pct    = stats.ok + stats.fail > 0 ? Math.round(stats.ok / (stats.ok + stats.fail) * 100) : 100;
  const hColor = healthPct > 60 ? '#ffffff' : healthPct > 30 ? '#aaaaaa' : '#ff3333';

  return (
    <group position={position}>
      <Text position={[0, 4.8, 0]} fontSize={0.38} color="#ffffff" anchorX="center" outlineWidth={0.005} outlineColor="#000000" letterSpacing={0.08}>СЕТЬ GOVCHAIN</Text>
      <Text position={[0, 4.33, 0]} fontSize={0.12} color="#888888" anchorX="center">Децентрализованная Гос. Архитектура</Text>

      {edges.map(([ea, eb], idx) => {
        const key = `${Math.min(ea,eb)}-${Math.max(ea,eb)}`;
        const act = nodes[ea] && nodes[eb];
        const hl  = hlEdges.has(key);
        return (
          <group key={`edge-${idx}`}>
            <Edge from={nodePos[ea]} to={nodePos[eb]} active={act} highlighted={hl} />
          </group>
        );
      })}

      {nodes.map((v, i) => (
        <NetNode key={i} position={nodePos[i]} active={v}
          onClick={() => setNodes(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
          label={names[i]} sublabel={v ? undefined : '⚠'} />
      ))}

      {txs.map(tx => <TxPacket key={`tx-${tx.id}`} id={tx.id} path={tx.path} color={tx.color} onDone={handleDone} duration={0.4 + tx.hops * 0.2} />)}
      {effects.map(e => <Burst key={`eff-${e.id}`} position={e.pos} color={e.color} type={e.type} />)}

      <CityBuildings nodes={nodes} nodePos={nodePos} decentralized />

      <Text position={[0, -4.0, 0]} fontSize={0.18} color={isConnected ? '#00ff88' : '#ff2244'} anchorX="center">
        {isConnected ? `🟢 В СЕТИ · ${pct}%` : '🔴 СЕТЬ РАЗДЕЛЕНА'}
      </Text>
    </group>
  );
}

/* ═══ VS DIVIDER — EPIC ═══ */
function VsDivider() {
  const r1 = useRef(), r2 = useRef(), r3 = useRef(), r4 = useRef();
  const orbRef = useRef();
  const col1Ref = useRef(), col2Ref = useRef();

  const particles = useMemo(() => {
    const n = 60; const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 1.5;
      a[i*3] = Math.cos(t) * r; a[i*3+1] = Math.random() * 18 - 9; a[i*3+2] = Math.sin(t) * r;
    }
    return a;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (r1.current) r1.current.rotation.z = t * 0.65;
    if (r2.current) { r2.current.rotation.z = -t * 0.45; r2.current.rotation.x = t * 0.25; }
    if (r3.current) { r3.current.rotation.y = t * 0.38; r3.current.rotation.x = -t * 0.18; }
    if (r4.current) r4.current.rotation.z = t * 0.22;
    if (orbRef.current) {
      orbRef.current.position.y = 4.5 + Math.sin(t * 0.85) * 0.3;
      orbRef.current.rotation.y = t * 0.5;
    }
    const pulse = 0.3 + Math.sin(t * 1.8) * 0.15;
    if (col1Ref.current) col1Ref.current.material.opacity = pulse;
    if (col2Ref.current) col2Ref.current.material.opacity = pulse * 0.5;
  });

  return (
    <group>
      {/* Main energy column */}
      <mesh ref={col1Ref}><cylinderGeometry args={[0.014, 0.014, 20, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.35} /></mesh>
      {/* Outer glow column */}
      <mesh ref={col2Ref}><cylinderGeometry args={[0.08, 0.08, 20, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.04} /></mesh>

      {/* Scan rings along column */}
      {[-6, -3, 0, 3, 6].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI/2, 0, (Math.PI/5) * i]}>
          <ringGeometry args={[0.18, 0.22, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Central orb cluster */}
      <group ref={orbRef} position={[0, 4.5, 0]}>
        {/* Core */}
        <mesh><sphereGeometry args={[0.35, 20, 20]} /><meshPhysicalMaterial color="#888888" emissive="#ffffff" emissiveIntensity={1} metalness={1} roughness={0} clearcoat={1} /></mesh>
        {/* Orbit rings */}
        <group ref={r1}><mesh><torusGeometry args={[0.58, 0.022, 10, 50]} /><meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={6} /></mesh></group>
        <group ref={r2} rotation={[Math.PI/2.5, 0, 0]}><mesh><torusGeometry args={[0.42, 0.016, 8, 36]} /><meshPhysicalMaterial color="#cccccc" emissive="#cccccc" emissiveIntensity={4} transparent opacity={0.8} /></mesh></group>
        <group ref={r3} rotation={[Math.PI/4, Math.PI/5, 0]}><mesh><torusGeometry args={[0.28, 0.011, 7, 24]} /><meshPhysicalMaterial color="#aaaaaa" emissive="#aaaaaa" emissiveIntensity={3} transparent opacity={0.65} /></mesh></group>
        <group ref={r4} rotation={[0, Math.PI/3, Math.PI/6]}><mesh><torusGeometry args={[0.68, 0.008, 6, 40]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.2} /></mesh></group>
        {/* Floating hex above orb */}
        <group position={[0, 1.1, 0]}>
          <mesh><cylinderGeometry args={[0.4, 0.4, 0.09, 6]} /><meshPhysicalMaterial color="#888888" emissive="#ffffff" emissiveIntensity={0.6} metalness={1} roughness={0} clearcoat={1} /></mesh>
          <mesh><cylinderGeometry args={[0.44, 0.44, 0.07, 6]} /><meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.45} depthWrite={false} /></mesh>
        </group>
        {/* VS text */}
        <Text position={[0, 1.95, 0]} fontSize={0.28} color="#ffffff" anchorX="center" letterSpacing={0.18} outlineWidth={0.006} outlineColor="#000000">VS</Text>
      </group>

      {/* Floating particles */}
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" count={60} array={particles} itemSize={3} /></bufferGeometry>
        <pointsMaterial size={0.055} color="#ffffff" transparent opacity={0.5} sizeAttenuation />
      </points>
    </group>
  );
}

export default function Scene1() {
  return (
    <group position={[0, 4, 0]}>
      <CentralizedNet position={[-8.5, 0, 0]} />
      <VsDivider />
      <DecentralizedNet position={[8.5, 0, 0]} />
    </group>
  );
}

