import React from 'react';

const TerminalCard = ({ title = '[ENCRYPTED]', children, className = '', ...props }) => (
    <div className={`terminal-card ${className}`} {...props}>
        <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="text-neon-green text-xs ml-2 tracking-wider">{title}</span>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

export default TerminalCard;
