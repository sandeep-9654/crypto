import React from 'react';

const statusConfig = {
    PENDING: { color: 'text-warning-yellow', bg: 'border-warning-yellow', label: '● PENDING', pulse: true },
    APPROVED: { color: 'text-neon-green', bg: 'border-neon-green', label: '✓ APPROVED', pulse: false },
    REJECTED: { color: 'text-danger-red', bg: 'border-danger-red', label: '✗ REJECTED', pulse: false }
};

const ApprovalStatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
        <span className={`inline-flex items-center px-3 py-1 border ${config.bg} ${config.color} text-xs tracking-wider ${config.pulse ? 'animate-pulse-glow' : ''}`}>
            {config.label}
        </span>
    );
};

export default ApprovalStatusBadge;
