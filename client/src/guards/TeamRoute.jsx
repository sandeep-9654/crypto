import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TeamRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-hacker-black flex items-center justify-center">
                <div className="text-neon-green font-mono">
                    <span className="terminal-spinner"></span> AUTHENTICATING...
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'team') {
        return <Navigate to="/login" replace />;
    }

    if (user.approvalStatus === 'PENDING') {
        return <Navigate to="/pending" replace />;
    }

    if (user.approvalStatus === 'REJECTED') {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default TeamRoute;
