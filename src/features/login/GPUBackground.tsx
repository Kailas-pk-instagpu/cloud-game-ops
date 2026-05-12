import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Galaxy() {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const COUNT = 18000;
    const ARMS = 5;
    const RADIUS = 6;
    const SPIN = 1.1;
    const RANDOMNESS = 0.45;
    const RAND_POW = 3;

    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    const inside = new THREE.Color('#a78bfa'); // violet core
    const outside = new THREE.Color('#22d3ee'); // cyan outer

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const radius = Math.pow(Math.random(), 1.5) * RADIUS;
      const branchAngle = ((i % ARMS) / ARMS) * Math.PI * 2;
      const spinAngle = radius * SPIN;

      const rx = Math.pow(Math.random(), RAND_POW) * (Math.random() < 0.5 ? 1 : -1) * RANDOMNESS * radius;
      const ry = Math.pow(Math.random(), RAND_POW) * (Math.random() < 0.5 ? 1 : -1) * RANDOMNESS * radius * 0.35;
      const rz = Math.pow(Math.random(), RAND_POW) * (Math.random() < 0.5 ? 1 : -1) * RANDOMNESS * radius;

      positions[i3] = Math.cos(branchAngle + spinAngle) * radius + rx;
      positions[i3 + 1] = ry;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + rz;

      const mixed = inside.clone().lerp(outside, radius / RADIUS);
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={ref} rotation={[Math.PI / 2.6, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        transparent
      />
    </points>
  );
}

function Stars() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return arr;
  }, []);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.01;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function GPUBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 2.5, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#05050d']} />
        <Stars />
        <Galaxy />
      </Canvas>
    </div>
  );
}
