import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-hacker-black flex items-center justify-center">
                <div className="text-neon-green font-mono">
                    <span className="terminal-spinner"></span> VERIFYING ADMIN ACCESS...
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminRoute;
