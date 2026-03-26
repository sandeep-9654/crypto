/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'hacker-black': '#0a0a0a',
                'neon-green': '#00ff41',
                'electric-cyan': '#00e5ff',
                'dark-navy': '#0d1117',
                'terminal-dark': '#0c0c0c',
                'terminal-border': '#1a3a1a',
                'danger-red': '#ff0040',
                'warning-yellow': '#ffb700',
                'success-green': '#00ff41'
            },
            fontFamily: {
                mono: ['"Share Tech Mono"', 'Courier New', 'monospace']
            },
            animation: {
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'glitch': 'glitch 2.5s infinite',
                'scanline': 'scanline 8s linear infinite',
                'typing': 'typing 0.8s steps(1) infinite',
                'shake': 'shake 0.5s ease-in-out',
                'matrix-fade': 'matrixFade 1s ease-out'
            },
            keyframes: {
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 5px #00ff41, 0 0 10px #00ff41' },
                    '50%': { boxShadow: '0 0 20px #00ff41, 0 0 40px #00ff41' }
                },
                glitch: {
                    '0%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(-2px, 2px)' },
                    '40%': { transform: 'translate(-2px, -2px)' },
                    '60%': { transform: 'translate(2px, 2px)' },
                    '80%': { transform: 'translate(2px, -2px)' },
                    '100%': { transform: 'translate(0)' }
                },
                scanline: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' }
                },
                typing: {
                    '0%, 50%': { borderColor: '#00ff41' },
                    '51%, 100%': { borderColor: 'transparent' }
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
                },
                matrixFade: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                }
            }
        }
    },
    plugins: []
};
