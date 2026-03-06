import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// An algorithmic generator for realistically shaped teeth 
// In a true medical application, this is replaced by the 32 scanned GLTF meshes.
// For this high-end demo, we procedurally generate arch-aligned shapes that resemble realistic teeth.

const ToothGeometry = ({ type, position, rotation, scale, i, isSelected, condition, onClick, onHover, onUnhover }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    // We use realistic subsurface-like shading for enamel
    const materialProps = useMemo(() => {
        let conditionColor = '#f8fcff'; // Healthy/Default
        if (condition) {
            const cond = condition.toLowerCase();
            if (['decayed', 'fractured', 'abscess', 'active problem'].includes(cond)) conditionColor = '#e74c3c'; // Red
            else if (['filled', 'treated'].includes(cond)) conditionColor = '#3498db'; // Blue
            else if (['missing'].includes(cond)) conditionColor = '#95a5a6'; // Grey
            else if (['sensitive', 'watch', 'monitor'].includes(cond)) conditionColor = '#f1c40f'; // Yellow
            else if (['implant', 'crown placed', 'bridge abutment', 'crown'].includes(cond)) conditionColor = '#2ecc71'; // Green
            else if (['rct done'].includes(cond)) conditionColor = '#e67e22'; // Orange
        }

        const baseColor = isSelected ? '#135bec' : (hovered ? '#4cf0ff' : conditionColor);

        return {
            color: baseColor,
            roughness: condition === 'missing' ? 1 : 0.2, // Missing looks duller
            metalness: 0.1,
            emissive: isSelected ? '#135bec' : '#000000',
            emissiveIntensity: isSelected ? 0.2 : 0,
            transparent: true,
            opacity: condition === 'missing' ? 0.2 : 1 // Hide missing teeth slightly
        };
    }, [isSelected, hovered, condition]);

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

export function RealisticDentition({ selectedTooth, onSelectTooth, toothChartData = {} }: { selectedTooth: number | null, onSelectTooth: (num: number) => void, toothChartData?: any }) {

    // Generate the upper and lower arch (32 teeth) positioned procedurally in a U-shape
    const renderArch = (isUpper: boolean) => {
        const teeth = [];
        const radius = 3.5; // Radius of the dental arch
        const archY = isUpper ? 0.6 : -0.6; // Y separation between upper and lower

        const upperIds = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
        const lowerIds = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
        const idMap = isUpper ? upperIds : lowerIds;

        for (let i = 0; i < 16; i++) {
            // Calculate angle along the U-shape (semi-circle)
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

            const toothId = idMap[i];
            const toothInfo = toothChartData[toothId];
            const tCondition = toothInfo ? toothInfo.condition : null;

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
                    condition={tCondition}
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
