/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--bg-deep)',
                'background-light': 'var(--surface-bg)',
                'background-soft': 'var(--surface-bg)',
                'background-dark': 'var(--bg-deep)',
                surface: 'var(--surface-bg)',
                'surface-hover': 'rgba(255, 255, 255, 0.08)',
                'surface-muted': 'rgba(255, 255, 255, 0.03)',
                panel: 'rgba(10, 25, 41, 0.6)',
                primary: 'var(--accent-cyan)',
                'primary-hover': 'var(--accent-glow)',
                'primary-light': 'rgba(0, 240, 255, 0.15)',
                'secondary-mint': '#84E5D4',
                accent: '#00F0FF',
                alert: '#F5A623',
                success: '#84E5D4',
                danger: '#FF4C4C',
                text: {
                    main: 'var(--text-main)',
                    muted: 'var(--text-muted)',
                    dark: 'var(--text-main)',
                }
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
                display: ['Bricolage', 'Outfit', 'sans-serif'],
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
