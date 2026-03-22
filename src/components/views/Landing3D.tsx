import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function RotatingMesh() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.rotation.x += 0.002;
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.2}>
            <mesh ref={meshRef}>
                {/* Advanced Torus Knot Geometry */}
                <torusKnotGeometry args={[1.2, 0.4, 256, 64]} />
                <MeshDistortMaterial
                    color="#00C8FF"
                    attach="material"
                    distort={0.4}
                    speed={2}
                    roughness={0.1}
                    metalness={0.3}
                    clearcoat={1}
                    clearcoatRoughness={0.05}
                />
            </mesh>
        </Float>
    );
}

export default function Landing3D() {
    return (
        <div className="w-full h-full absolute inset-0 -z-10 pointer-events-none opacity-40">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <pointLight position={[-10, -10, -5]} color="#007BFF" intensity={0.8} />
                <pointLight position={[10, -10, 5]} color="#48C9B0" intensity={0.8} />

                <RotatingMesh />

                <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
        </div>
    );
}
