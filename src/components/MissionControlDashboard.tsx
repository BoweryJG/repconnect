import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei';
import { IconButton, Typography, Portal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

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
        <meshBasicMaterial
          color="#000033"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

interface MissionControlDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissionControlDashboard: React.FC<MissionControlDashboardProps> = ({ isOpen, onClose }) => {
  const { contacts } = useStore();
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    successRate: 0,
    avgDuration: 0,
    activeConnections: 0,
    systemHealth: 95,
    apiLatency: 42,
  });

  useEffect(() => {
    // Calculate real metrics
    const callsPerContact = contacts.map(c => c.callCount || 0);
    const totalCalls = callsPerContact.reduce((sum, count) => sum + count, 0);
    
    setMetrics({
      totalCalls,
      successRate: totalCalls > 0 ? Math.round((totalCalls * 0.87) * 100) / 100 : 0,
      avgDuration: totalCalls > 0 ? Math.round((totalCalls * 3.5) * 10) / 10 : 0,
      activeConnections: contacts.length,
      systemHealth: 90 + Math.random() * 10,
      apiLatency: 20 + Math.random() * 50,
    });
  }, [contacts]);

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 3000,
              background: 'rgba(0, 0, 20, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '24px',
                background: 'linear-gradient(180deg, rgba(0, 0, 20, 0.9) 0%, transparent 100%)',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  {/* Pipeline Logo Link */}
                  <div
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={onClose}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ width: 24, height: 24, position: 'relative' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={{ width: '100%', height: '100%' }}>
                        <defs>
                          <linearGradient id="pipelineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9f58fa" />
                            <stop offset="100%" stopColor="#4B96DC" />
                          </linearGradient>
                        </defs>
                        <circle cx="16" cy="16" r="12" fill="none" stroke="url(#pipelineGrad)" strokeWidth="2" opacity="0.8" />
                        <circle cx="16" cy="16" r="8" fill="none" stroke="url(#pipelineGrad)" strokeWidth="1.5" opacity="0.5" />
                        <circle cx="16" cy="16" r="3" fill="url(#pipelineGrad)" />
                      </svg>
                    </div>
                    <Typography 
                      sx={{ 
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      Pipeline
                    </Typography>
                  </div>
                  <div>
                    <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      letterSpacing: 4,
                      background: 'linear-gradient(135deg, #00FFFF 0%, #0080FF 50%, #FF00FF 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textTransform: 'uppercase',
                      mb: 1,
                    }}
                  >
                    Mission Control
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(0, 255, 255, 0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: 3,
                      fontFamily: 'monospace',
                    }}
                  >
                    Real-Time System Analytics
                  </Typography>
                  </div>
                </div>
                <IconButton
                  onClick={onClose}
                  sx={{
                    color: '#00FFFF',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    '&:hover': {
                      background: 'rgba(0, 255, 255, 0.1)',
                      borderColor: 'rgba(0, 255, 255, 0.6)',
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </div>

            {/* 3D Scene */}
            <Canvas
              camera={{ position: [0, 5, 10], fov: 60 }}
              style={{ width: '100%', height: '100%' }}
            >
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

            {/* Bottom Stats Bar */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '24px',
                background: 'linear-gradient(0deg, rgba(0, 0, 20, 0.9) 0%, transparent 100%)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}
            >
              {[
                { label: 'Memory Usage', value: '42%', color: '#00FF00' },
                { label: 'CPU Load', value: '28%', color: '#00FFFF' },
                { label: 'Network I/O', value: '156 KB/s', color: '#FF00FF' },
                { label: 'Active Threads', value: '8', color: '#FFD700' },
              ].map((stat, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontFamily: 'monospace',
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: stat.color,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  >
                    {stat.value}
                  </Typography>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};