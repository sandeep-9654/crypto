import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlitchText from '../components/GlitchText';
import TerminalCard from '../components/TerminalCard';

const RoundComplete = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-hacker-black flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <TerminalCard title="[ROUND COMPLETE]" className="max-w-lg w-full">
                    <div className="text-center space-y-6 py-4">
                        <GlitchText text="ROUND CLEARED" tag="h2" className="text-3xl text-neon-green" />
                        <p className="text-electric-cyan">Excellent work, operative. Preparing next level...</p>
                        <div className="text-neon-green opacity-50 text-sm">{'>'} Waiting for admin to activate next round...█</div>
                        <button onClick={() => navigate('/dashboard')} className="btn-primary">RETURN_TO_DASHBOARD</button>
                    </div>
                </TerminalCard>
            </motion.div>
        </div>
    );
};

export default RoundComplete;
