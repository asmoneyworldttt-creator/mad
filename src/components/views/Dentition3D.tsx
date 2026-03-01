import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// An algorithmic generator for realistically shaped teeth 
// In a true medical application, this is replaced by the 32 scanned GLTF meshes.
// For this high-end demo, we procedurally generate arch-aligned shapes that resemble realistic teeth.

const ToothGeometry = ({ type, position, rotation, scale, i, isSelected, onClick, onHover, onUnhover }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    // We use realistic subsurface-like shading for enamel
    const materialProps = useMemo(() => {
        return {
            color: isSelected ? '#135bec' : (hovered ? '#4cf0ff' : '#f8fcff'),
            roughness: 0.2,
            metalness: 0.1,
            emissive: isSelected ? '#135bec' : '#000000',
            emissiveIntensity: isSelected ? 0.2 : 0,
        };
    }, [isSelected, hovered]);

    // Procedural subtle animation for interactive feel
    useFrame((state) => {
        if (meshRef.current && hovered && !isSelected) {
            meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 5) * 0.005;
        }
    });

    const handlePointerOver = (e: any) => {
        e.stopPropagation();
        setHover(true);
        onHover(i);
        document.body.style.cursor = 'pointer';
    };

    const handlePointerOut = () => {
        setHover(false);
        onUnhover();
        document.body.style.cursor = 'auto';
    };

    const handleClick = (e: any) => {
        e.stopPropagation();
        onClick(i);
    };

    return (
        <mesh
            ref={meshRef}
            position={position}
            rotation={rotation}
            scale={scale}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
            castShadow
            receiveShadow
        >
            {/* We use specific geometries with soft scaling and radius rather than hard blocks */}
            {type === 'incisor' && <sphereGeometry args={[0.3, 32, 16]} />}
            {type === 'canine' && <sphereGeometry args={[0.35, 32, 16]} />}
            {type === 'premolar' && <sphereGeometry args={[0.4, 32, 16]} />}
            {type === 'molar' && <boxGeometry args={[0.6, 0.6, 0.6, 16, 16, 16]} />}

            <meshStandardMaterial {...materialProps} />
        </mesh>
    );
};

export function RealisticDentition({ selectedTooth, onSelectTooth }: { selectedTooth: number | null, onSelectTooth: (num: number) => void }) {

    // Generate the upper and lower arch (32 teeth) positioned procedurally in a U-shape
    const renderArch = (isUpper: boolean) => {
        const teeth = [];
        const radius = 3.5; // Radius of the dental arch
        const archY = isUpper ? 0.6 : -0.6; // Y separation between upper and lower

        // Tooth IDs for upper arch: 1-16. Lower arch: 32-17 (right to left)
        // To simplify procedural mapping, we'll map 1-16 on top, 17-32 on bottom

        for (let i = 0; i < 16; i++) {
            // Calculate angle along the U-shape (semi-circle)
            // We map i to an angle. i=0 -> right back, i=7,8 -> front center, i=15 -> left back
            const angle = Math.PI - (i * Math.PI) / 15;

            const x = Math.cos(angle) * (radius - (i === 7 || i === 8 ? 0.5 : 0)); // Slightly flatten front
            const z = Math.sin(angle) * radius * 1.5; // Elongate the arch

            // Determine tooth type based on position
            let type = 'molar';
            if (i >= 5 && i <= 10) type = 'incisor';
            if (i === 4 || i === 11) type = 'canine';
            if (i === 3 || i === 12 || i === 2 || i === 13) type = 'premolar';

            // Subtle rotation so teeth follow the curve
            const rotationY = -angle + Math.PI / 2;
            const rotationX = isUpper ? 0.1 : -0.1; // Flare out slightly
            const rotationZ = (i - 7.5) * (isUpper ? -0.05 : 0.05);

            const toothId = isUpper ? 16 - i : 17 + i;

            teeth.push(
                <ToothGeometry
                    key={toothId}
                    i={toothId}
                    type={type}
                    position={[x, archY, z]}
                    rotation={[rotationX, rotationY, rotationZ]}
                    scale={
                        type === 'molar' ? [1.2, 1.5, 1.2] :
                            type === 'premolar' ? [1.0, 1.6, 0.9] :
                                type === 'canine' ? [0.8, 2.0, 0.8] :
                                    [1.2, 2.0, 0.4] // incisor
                    }
                    isSelected={selectedTooth === toothId}
                    onClick={onSelectTooth}
                    onHover={() => { }}
                    onUnhover={() => { }}
                />
            );
        }
        return teeth;
    };

    return (
        <group position={[0, 0, -2]}>
            {renderArch(true)}
            {renderArch(false)}
        </group>
    );
}
