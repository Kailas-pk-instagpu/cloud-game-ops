import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Environment } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function GPUCard({ position, rotation, color }: { position: [number, number, number]; rotation: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = rotation[1] + Math.sin(t * 0.4) * 0.3;
    ref.current.rotation.x = rotation[0] + Math.cos(t * 0.3) * 0.15;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <group ref={ref} position={position} rotation={rotation}>
        {/* PCB board */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.2, 1.2, 0.12]} />
          <meshStandardMaterial color="#0b1a14" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Heatsink fins */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[-1.3 + i * 0.22, 0.15, 0.18]}>
            <boxGeometry args={[0.08, 0.7, 0.5]} />
            <meshStandardMaterial color="#1a2a35" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        {/* Glowing core */}
        <mesh position={[0, -0.15, 0.14]}>
          <boxGeometry args={[1.0, 0.5, 0.05]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        {/* Two fans */}
        <Fan position={[-0.8, 0, 0.2]} color={color} />
        <Fan position={[0.8, 0, 0.2]} color={color} />
      </group>
    </Float>
  );
}

function Fan({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 4;
  });
  return (
    <group position={position}>
      <mesh>
        <torusGeometry args={[0.42, 0.06, 12, 32]} />
        <meshStandardMaterial color="#0f1720" metalness={0.8} roughness={0.3} />
      </mesh>
      <group ref={ref}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
            <boxGeometry args={[0.36, 0.08, 0.02]} />
            <meshStandardMaterial color="#2a3540" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    return arr;
  }, []);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.04;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#7dd3fc" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Blob() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.15;
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -4]}>
      <icosahedronGeometry args={[2.4, 6]} />
      <MeshDistortMaterial color="#1e3a5f" emissive="#0ea5e9" emissiveIntensity={0.25} distort={0.45} speed={1.2} roughness={0.4} metalness={0.5} />
    </mesh>
  );
}

export default function GPUBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 7], fov: 55 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#05080d']} />
        <fog attach="fog" args={['#05080d', 8, 18]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 5, 5]} intensity={0.9} />
        <pointLight position={[-4, -2, 3]} intensity={1.2} color="#0ea5e9" />
        <pointLight position={[4, 3, 2]} intensity={0.8} color="#a855f7" />

        <Blob />
        <Particles />

        <GPUCard position={[-3.2, 1.6, -1]} rotation={[0.2, -0.5, 0.1]} color="#0ea5e9" />
        <GPUCard position={[3.4, -1.2, -0.5]} rotation={[-0.15, 0.6, -0.1]} color="#a855f7" />
        <GPUCard position={[0, 2.4, -3]} rotation={[0.1, 0.2, 0]} color="#22d3ee" />

        <Environment preset="night" />
      </Canvas>
    </div>
  );
}
