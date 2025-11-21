
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import { GeoThreat, ThreatLevel } from '../types';
import { getGlobalThreats } from '../services/analyticsService';
import * as THREE from 'three';
import { Loader2, ShieldAlert } from 'lucide-react';

// Fix for missing React Three Fiber type definitions in the current environment
// Augmenting 'react' module is necessary for newer React types where JSX is scoped
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      cylinderGeometry: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
    }
  }
}

// Keep global augmentation as fallback
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      cylinderGeometry: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      meshBasicMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
    }
  }
}

// Helper to convert Lat/Lon to 3D Cartesian coordinates on a sphere
const latLongToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
};

const ThreatBeacon: React.FC<{ threat: GeoThreat; radius: number }> = ({ threat, radius }) => {
  const [hovered, setHovered] = useState(false);
  const position = useMemo(() => latLongToVector3(threat.lat, threat.lng, radius), [threat, radius]);
  
  const color = threat.level === ThreatLevel.HIGH ? '#ef4444' : 
                threat.level === ThreatLevel.MODERATE ? '#eab308' : '#22c55e';
  
  const height = threat.level === ThreatLevel.HIGH ? 1.5 : 
                 threat.level === ThreatLevel.MODERATE ? 1.0 : 0.5;

  // Determine rotation to point outwards from center
  const quaternion = useMemo(() => {
    const dummy = new THREE.Object3D();
    dummy.position.copy(position);
    dummy.lookAt(0, 0, 0);
    return dummy.quaternion;
  }, [position]);

  return (
    <group position={position} quaternion={quaternion}>
      {/* The Beacon Stick */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, height / 2]}>
        <cylinderGeometry args={[0.05, 0.05, height, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>

      {/* The Glow Sphere at top */}
      <mesh position={[0, 0, height]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Hover Info Card */}
      {hovered && (
        <Html position={[0, 0, height + 0.5]} center distanceFactor={15}>
          <div className="bg-slate-900/90 backdrop-blur-sm text-white p-3 rounded-lg border border-slate-700 w-48 shadow-xl pointer-events-none">
            <h4 className="font-bold text-sm flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${threat.level === 'HIGH' ? 'bg-red-500' : threat.level === 'MODERATE' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
               {threat.locationName}
            </h4>
            <div className="mt-2 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                    <span>Risk Level:</span>
                    <span className={color === '#ef4444' ? 'text-red-400' : color === '#eab308' ? 'text-yellow-400' : 'text-green-400'}>{threat.level}</span>
                </div>
                <div className="flex justify-between">
                    <span>Incidents:</span>
                    <span className="font-mono">{threat.incidentCount}</span>
                </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

const Earth = () => {
  const earthRadius = 5;
  
  return (
    <mesh>
      <sphereGeometry args={[earthRadius, 64, 64]} />
      <meshStandardMaterial 
        color="#1e293b" 
        roughness={0.7} 
        metalness={0.1}
      />
      {/* Wireframe overlay for tech feel */}
      <mesh>
        <sphereGeometry args={[earthRadius + 0.02, 32, 32]} />
        <meshBasicMaterial color="#334155" wireframe transparent opacity={0.2} />
      </mesh>
    </mesh>
  );
};

const Scene = ({ threats }: { threats: GeoThreat[] }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001; // Slow rotation
    }
  });

  return (
    <group ref={groupRef}>
      <Earth />
      {threats.map((threat) => (
        <ThreatBeacon key={threat.id} threat={threat} radius={5} />
      ))}
    </group>
  );
};

const ThreatMap: React.FC = () => {
  const [threats, setThreats] = useState<GeoThreat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getGlobalThreats();
      setThreats(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-950 relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Overlay HUD */}
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
            <h2 className="text-3xl font-bold text-white tracking-tight">Global Threat Intelligence</h2>
            <p className="text-slate-400 text-sm max-w-md mt-2">
                Real-time visualization of on-chain counterfeit incidents. 
                Beacons represent supply chain nodes reporting anomalies.
            </p>
            <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></span>
                    High Risk
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]"></span>
                    Moderate
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                    Low Risk
                </div>
            </div>
        </div>

        {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900">
                <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
            </div>
        )}

        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
            <color attach="background" args={['#020617']} />
            <ambientLight intensity={0.5} color="#94a3b8" />
            <pointLight position={[15, 15, 15]} intensity={1} color="#38bdf8" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f472b6" />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            <Scene threats={threats} />
            
            <OrbitControls 
                enablePan={false} 
                minDistance={8} 
                maxDistance={20}
                autoRotate={false} // We rotate the group manually
            />
        </Canvas>

        {/* Bottom Stats Panel */}
        <div className="absolute bottom-6 right-6 z-10 pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-4 rounded-xl w-64">
                <div className="flex items-center gap-2 mb-3 text-white">
                    <ShieldAlert className="w-5 h-5 text-teal-500" />
                    <span className="font-bold text-sm">Live Incident Feed</span>
                </div>
                <div className="space-y-2">
                    {threats.filter(t => t.level === 'HIGH').slice(0, 3).map(t => (
                        <div key={t.id} className="flex justify-between items-center text-xs border-b border-slate-800 pb-1 last:border-0">
                            <span className="text-slate-300">{t.locationName}</span>
                            <span className="text-red-400 font-mono">{t.incidentCount} Flags</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ThreatMap;
