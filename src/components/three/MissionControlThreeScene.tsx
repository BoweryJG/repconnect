import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 3D Components
function DataSphere({ position, color, value, label }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      const scale = hovered ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <MeshDistortMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.8}
            distort={0.3}
            speed={2}
          />
        </mesh>
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="#00FFFF"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
        <Text
          position={[0, -1.5, 0]}
          fontSize={0.5}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {value}
        </Text>
      </group>
    </Float>
  );
}

function ParticleField() {
  const points = useRef<THREE.Points>(null);
  const particlesCount = 1000;

  const positions = new Float32Array(particlesCount * 3);
  const colors = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

    colors[i * 3] = Math.random();
    colors[i * 3 + 1] = Math.random();
    colors[i * 3 + 2] = Math.random();
  }

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.x = state.clock.elapsedTime * 0.05;
      points.current.rotation.y = state.clock.elapsedTime * 0.075;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particlesCount}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function HolographicGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <>
      <gridHelper ref={gridRef} args={[20, 20, '#00FFFF', '#004444']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial color="#000033" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

interface ThreeSceneProps {
  metrics: {
    totalCalls: number;
    successRate: number;
    avgDuration: number;
    activeConnections: number;
    systemHealth: number;
    apiLatency: number;
  };
}

const MissionControlThreeScene: React.FC<ThreeSceneProps> = ({ metrics }) => {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 60 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00FFFF" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FF00FF" />

      <ParticleField />
      <HolographicGrid />

      {/* Data Spheres */}
      <DataSphere
        position={[-5, 0, 0]}
        color="#00FF00"
        value={`${metrics.systemHealth.toFixed(0)}%`}
        label="System Health"
      />
      <DataSphere
        position={[5, 0, 0]}
        color="#FF00FF"
        value={metrics.totalCalls}
        label="Total Calls"
      />
      <DataSphere
        position={[0, 0, -5]}
        color="#00FFFF"
        value={`${metrics.apiLatency.toFixed(0)}ms`}
        label="API Latency"
      />
      <DataSphere
        position={[0, 0, 5]}
        color="#FFD700"
        value={metrics.activeConnections}
        label="Connections"
      />
      <DataSphere
        position={[-3, 3, 0]}
        color="#FF6B6B"
        value={`${metrics.successRate}%`}
        label="Success Rate"
      />
      <DataSphere
        position={[3, 3, 0]}
        color="#4ECDC4"
        value={`${metrics.avgDuration}m`}
        label="Avg Duration"
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
    </Canvas>
  );
};

export default MissionControlThreeScene;
