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
                'surface-hover': 'rgba(255, 255, 255, 0.1)',
                'surface-muted': 'rgba(255, 255, 255, 0.05)',
                panel: 'rgba(255, 255, 255, 0.05)',
                primary: 'var(--accent-cyan)',
                'primary-hover': 'var(--accent-cyan)',
                'primary-light': 'rgba(0, 229, 255, 0.15)',
                'medical-teal': '#2dd4bf',
                'medical-blue': '#38bdf8',
                accent: '#818cf8',
                alert: '#f59e0b',
                success: '#10b981',
                danger: '#ef4444',
                text: {
                    main: 'var(--text-main)',
                    muted: 'var(--text-main)',
                    dark: 'var(--text-main)',
                }
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                display: ['"Outfit"', 'sans-serif'],
            },
            animation: {
                pulse: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                float: 'float 4s ease-in-out infinite',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'glow': 'glow 3s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                slideUp: {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)' },
                    '100%': { boxShadow: '0 0 25px rgba(0, 229, 255, 0.6)' },
                }
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'premium': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 8px 16px -4px rgba(0, 0, 0, 0.4)',
                'neon': '0 0 20px -5px rgba(0, 229, 255, 0.5)',
            }
        },
    },
    plugins: [require("tailwindcss-animate")],
}
