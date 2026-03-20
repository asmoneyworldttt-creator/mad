import { useEffect, useRef } from "react";

export default function VoidField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const isMobile = window.innerWidth < 768;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // ── Particle count: fewer on mobile for performance ──
        const COUNT = isMobile ? 80 : 150;
        const CONNECT_DIST = isMobile ? 90 : 130;

        // AxoDental logo colors
        const colors = ["#00CFFF", "#7C3AED", "#FF6B35", "#3B6EFF", "#00CFFF", "#7C3AED"];

        const particles: {
            x: number; y: number;
            vx: number; vy: number;
            r: number; color: string; opacity: number;
        }[] = [];

        for (let i = 0; i < COUNT; i++) {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * (isMobile ? 0.12 : 0.2),
                vy: (Math.random() - 0.5) * (isMobile ? 0.12 : 0.2),
                r: Math.random() * 1.8 + 0.4,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: Math.random() * 0.5 + 0.15,
            });
        }

        // ── Pulsing ring state ──
        const rings = [
            { x: 0.15, y: 0.3, color: "#00CFFF", phase: 0 },
            { x: 0.85, y: 0.7, color: "#7C3AED", phase: Math.PI },
            { x: 0.5, y: 0.1, color: "#FF6B35", phase: Math.PI / 2 },
        ];

        let frame = 0;
        let animId: number;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;

            // ── Ambient nebula glows (3 corners) ──
            const drawGlow = (cx: number, cy: number, r: number, color: string, a: number) => {
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                g.addColorStop(0, color.replace(")", `, ${a})`).replace("rgb", "rgba"));
                g.addColorStop(1, "transparent");
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            };

            // Cyan top-left
            drawGlow(-50, canvas.height * 0.25, 500, "rgba(0,207,255", 0.06);
            // Violet bottom-right
            drawGlow(canvas.width + 60, canvas.height * 0.75, 550, "rgba(124,58,237", 0.07);
            // Coral top-center (subtle)
            drawGlow(canvas.width * 0.5, -80, 380, "rgba(255,107,53", 0.04);

            // ── Pulsing circuit rings ──
            if (!isMobile) {
                rings.forEach(ring => {
                    const cx = ring.x * canvas.width;
                    const cy = ring.y * canvas.height;
                    const pulse = Math.sin(frame * 0.02 + ring.phase);
                    const r1 = 60 + pulse * 20;
                    const r2 = 110 + pulse * 30;
                    const alpha = 0.04 + pulse * 0.025;

                    ctx.beginPath();
                    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
                    ctx.strokeStyle = ring.color;
                    ctx.globalAlpha = alpha;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(cx, cy, r2, 0, Math.PI * 2);
                    ctx.strokeStyle = ring.color;
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    ctx.globalAlpha = 1;
                });
            }

            // ── Neural connection lines between nearby particles ──
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECT_DIST) {
                        const lineAlpha = (1 - dist / CONNECT_DIST) * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = particles[i].color;
                        ctx.globalAlpha = lineAlpha;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            }

            // ── Draw & move particles ──
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                // Glow halo on each particle
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad;
                ctx.globalAlpha = p.opacity * 0.4;
                ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity;
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <div className="fixed inset-0 -z-20 pointer-events-none" style={{ background: "var(--bg-page)" }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
    );
}
