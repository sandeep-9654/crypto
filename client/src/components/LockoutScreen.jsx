import React from 'react';
import TerminalCard from './TerminalCard';

const LockoutScreen = ({ reason, violationCount }) => (
    <div className="fullscreen-overlay">
        <TerminalCard title="[✗ ACCESS REVOKED]" className="max-w-lg w-full mx-4">
            <div className="space-y-4 text-center">
                <h2 className="text-danger-red text-3xl font-bold animate-pulse">TEAM LOCKED OUT</h2>
                <div className="space-y-2 text-sm">
                    <p className="text-neon-green opacity-70">
                        Reason: <span className="text-danger-red">{reason === 'TAB_SWITCH' ? 'Multiple tab switch violations' : reason === 'CONNECTIVITY_LOSS' ? 'Connection timeout' : reason}</span>
                    </p>
                    {violationCount && (
                        <p className="text-neon-green opacity-70">
                            Violations recorded: <span className="text-danger-red">{violationCount}</span>
                        </p>
                    )}
                </div>
                <div className="border-t border-terminal-border pt-4 text-warning-yellow text-sm">
                    Contact the event administrator.
                </div>
                <div className="text-neon-green text-xs opacity-50">
                    {'>'} Awaiting admin authorization...█
                </div>
            </div>
        </TerminalCard>
    </div>
);

export default LockoutScreen;
