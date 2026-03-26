import React from 'react';
import { motion } from 'framer-motion';
import TerminalCard from './TerminalCard';

const ViolationWarningOverlay = ({ violationCount, onAcknowledge }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fullscreen-overlay"
    >
        <TerminalCard title="[⚠ SECURITY ALERT]" className="max-w-lg w-full mx-4">
            <div className="space-y-4 text-center">
                <h2 className="text-danger-red text-2xl font-bold">TAB SWITCH DETECTED</h2>
                <div className="text-warning-yellow text-lg">
                    Violation: <span className="text-danger-red font-bold">{violationCount}</span> of 3
                </div>
                <p className="text-neon-green opacity-70 text-sm">
                    Third violation = immediate TEAM LOCKOUT
                </p>
                <div className="border-t border-terminal-border pt-4">
                    <button onClick={onAcknowledge} className="btn-danger">
                        ACKNOWLEDGE_AND_CONTINUE
                    </button>
                </div>
            </div>
        </TerminalCard>
    </motion.div>
);

export default ViolationWarningOverlay;
