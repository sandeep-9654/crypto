import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TerminalCard from './TerminalCard';

const ConnectivityOverlay = ({ graceSeconds = 120, onExpired }) => {
    const [remaining, setRemaining] = useState(graceSeconds);

    useEffect(() => {
        if (remaining <= 0) {
            onExpired && onExpired();
            return;
        }
        const timer = setInterval(() => {
            setRemaining(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [remaining, onExpired]);

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fullscreen-overlay"
        >
            <TerminalCard title="[⚡ CONNECTION LOST]" className="max-w-lg w-full mx-4">
                <div className="space-y-4 text-center">
                    <h2 className="text-warning-yellow text-2xl font-bold">SIGNAL INTERRUPTED</h2>
                    <div className={`text-3xl font-bold tracking-wider ${remaining <= 30 ? 'text-danger-red animate-pulse' : 'text-electric-cyan'}`}>
                        Grace period: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    <p className="text-neon-green opacity-70 text-sm">
                        Reconnect to continue. After expiry, your team will be locked by the system.
                    </p>
                    <div className="text-neon-green text-xs opacity-50">
                        {'>'} Attempting reconnection...█
                    </div>
                </div>
            </TerminalCard>
        </motion.div>
    );
};

export default ConnectivityOverlay;
