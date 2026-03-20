import { useEffect, useRef } from "react";

export default function VoidField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const COUNT = 180;
        const particles: { x: number; y: number; vx: number; vy: number; r: number; color: string; opacity: number }[] = [];
        const colors = ["#00C8FF", "#7B2FE8", "#3B6EFF", "#FF6B35"];

        for (let i = 0; i < COUNT; i++) {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                r: Math.random() * 1.5 + 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: Math.random() * 0.6 + 0.1,
            });
        }

        let animId: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Ambient glows
            const glow1 = ctx.createRadialGradient(-80, 200, 0, -80, 200, 450);
            glow1.addColorStop(0, "rgba(0,200,255,0.06)");
            glow1.addColorStop(1, "transparent");
            ctx.fillStyle = glow1;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const glow2 = ctx.createRadialGradient(canvas.width + 80, canvas.height - 100, 0, canvas.width + 80, canvas.height - 100, 500);
            glow2.addColorStop(0, "rgba(123,47,232,0.07)");
            glow2.addColorStop(1, "transparent");
            ctx.fillStyle = glow2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Large center glow
            const glow3 = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, 600);
            glow3.addColorStop(0, "rgba(7,6,15,0.4)");
            glow3.addColorStop(1, "transparent");
            ctx.fillStyle = glow3;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

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
        <div className="fixed inset-0 -z-20 pointer-events-none bg-black">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
    );
}
