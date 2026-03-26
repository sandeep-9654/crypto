import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlitchText from '../components/GlitchText';
import TerminalCard from '../components/TerminalCard';

const cipherTypes = [
    { type: 'CCS', name: 'Caesar Cipher', desc: 'Shift-based substitution' },
    { type: 'TTT', name: 'Tic-Tac-Toe', desc: 'Image grid decryption' },
    { type: 'AC', name: 'Affine Cipher', desc: 'Mathematical substitution' },
    { type: 'GC', name: 'Grille Cipher', desc: 'Pattern overlay decoding' },
    { type: 'PCS', name: 'Polybius Caesar', desc: 'Number sequence cipher' },
    { type: 'MORSE', name: 'Morse Code', desc: 'Dot-dash encoding' },
    { type: 'CODE', name: 'C Code Output', desc: 'Program output analysis' }
];

const Landing = () => (
    <div className="min-h-screen bg-hacker-black relative">
        <div className="relative z-10 container mx-auto px-4 py-16">
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
            >
                <GlitchText text="CRYPTOGRAPHY" className="text-4xl md:text-6xl text-neon-green mb-4" />
                <p className="text-electric-cyan text-lg mt-4 opacity-70">{'>'} DECODE. DECRYPT. DOMINATE.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center gap-4 mb-16"
            >
                <Link to="/register" className="btn-primary text-lg px-8 py-3 no-underline">REGISTER</Link>
                <Link to="/login" className="btn-cyan text-lg px-8 py-3 no-underline">LOGIN</Link>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <TerminalCard title="[EVENT RULES]" className="max-w-3xl mx-auto mb-12">
                    <div className="space-y-3 text-sm">
                        <p className="text-electric-cyan">{'>'} Teams of 1-3 members</p>
                        <p className="text-electric-cyan">{'>'} Multiple rounds of increasing difficulty</p>
                        <p className="text-electric-cyan">{'>'} 3 tab switches = automatic lockout</p>
                        <p className="text-electric-cyan">{'>'} Hints available after 3 wrong attempts</p>
                        <p className="text-electric-cyan">{'>'} Fastest team with highest score wins</p>
                    </div>
                </TerminalCard>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 max-w-5xl mx-auto">
                {cipherTypes.map((cipher, i) => (
                    <motion.div
                        key={cipher.type}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        className="text-center p-3 border border-terminal-border rounded hover:border-neon-green transition-colors"
                    >
                        <span className={`cipher-badge ${cipher.type} mb-2`}>{cipher.type}</span>
                        <p className="text-xs text-neon-green mt-2 opacity-70">{cipher.name}</p>
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-16">
                <Link to="/leaderboard" className="text-electric-cyan hover:text-neon-green transition-colors text-sm">
                    {'>'} VIEW LIVE LEADERBOARD
                </Link>
            </div>
        </div>
    </div>
);

export default Landing;
