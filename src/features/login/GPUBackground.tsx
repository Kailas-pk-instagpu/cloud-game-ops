import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function StarField({ count, size, spread, speed, hueShift }: { count: number; size: number; spread: number; speed: number; hueShift: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#bcd4ff'),
      new THREE.Color('#ffd8a8'),
      new THREE.Color('#c8a8ff'),
      new THREE.Color('#a8e6ff'),
    ];
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // random points inside a sphere
      const r = Math.cbrt(Math.random()) * spread;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count, spread]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * speed;
    ref.current.rotation.x = Math.sin(t * speed * 0.5 + hueShift) * 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        sizeAttenuation
        depthWrite={false}
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        opacity={0.9}
      />
    </points>
  );
}

function Nebula({ position, color, scale }: { position: [number, number, number]; color: string; scale: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.z = t * 0.02;
    const s = scale + Math.sin(t * 0.3) * 0.1;
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

export default function GPUBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 65 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#03030a']} />

        {/* Soft nebula clouds */}
        <Nebula position={[-3, 1, -2]} color="#5b3fff" scale={3.5} />
        <Nebula position={[3.5, -1.5, -1]} color="#0ea5e9" scale={3} />
        <Nebula position={[0, 2, -3]} color="#ec4899" scale={2.5} />

        {/* Layered random starfields for depth and parallax */}
        <StarField count={4000} size={0.025} spread={14} speed={0.01} hueShift={0} />
        <StarField count={2000} size={0.045} spread={10} speed={0.02} hueShift={1.2} />
        <StarField count={800} size={0.07} spread={6} speed={0.03} hueShift={2.4} />
      </Canvas>
    </div>
  );
}
