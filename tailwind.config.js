/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--bg-mesh-2)',
                primary: 'var(--primary)',
                'primary-hover': 'var(--primary-hover)',
                'primary-glow': 'var(--primary-glow)',
                success: 'var(--success)',
                'success-glow': 'var(--success-glow)',
                warning: 'var(--warning)',
                error: 'var(--error)',
                surface: 'var(--glass-bg)',
                'surface-hover': 'rgba(255, 255, 255, 0.12)',
                'surface-muted': 'rgba(255, 255, 255, 0.05)',
                text: {
                    main: 'var(--text-main)',
                    muted: 'var(--text-muted)',
                    light: 'var(--text-light)',
                }
            },
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            animation: {
                pulse: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                float: 'float 6s cubic-bezier(0.25, 0.1, 0.25, 1) infinite',
                'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'glow': 'glow 4s ease-in-out infinite alternate',
                'ring-pulse': 'ringPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                slideUp: {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.1)' },
                    '100%': { boxShadow: '0 0 30px rgba(0, 240, 255, 0.4)' },
                },
                ringPulse: {
                    '0%': { boxShadow: '0 0 0 0 rgba(0, 240, 255, 0.3)' },
                    '70%': { boxShadow: '0 0 0 15px rgba(0, 240, 255, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(0, 240, 255, 0)' },
                }
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                'premium': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), inset 0 0 20px rgba(0, 240, 255, 0.02), 0 8px 16px -4px rgba(0, 0, 0, 0.5)',
                'neon': '0 0 20px -5px rgba(0, 240, 255, 0.5)',
                'neon-mint': '0 0 20px -5px rgba(132, 229, 212, 0.5)',
            },
            transitionTimingFunction: {
                'expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'fluid': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            }
        },
    },
    plugins: [require("tailwindcss-animate")],
}
