import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            // Run both checks in parallel for speed
            const [teamRes, adminRes] = await Promise.allSettled([
                api.get('/auth/approval-status'),
                api.get('/admin/dashboard')
            ]);

            if (teamRes.status === 'fulfilled') {
                setUser({
                    approvalStatus: teamRes.value.data.approvalStatus,
                    lockoutStatus: teamRes.value.data.lockoutStatus,
                    rejectionReason: teamRes.value.data.rejectionReason,
                    role: 'team'
                });
            } else if (adminRes.status === 'fulfilled') {
                setUser({ role: 'admin' });
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (teamName, password) => {
        const res = await api.post('/auth/login', { teamName, password });
        setUser({
            teamName,
            approvalStatus: res.data.approvalStatus,
            lockoutStatus: res.data.lockoutStatus,
            role: 'team'
        });
        return res.data;
    };

    const adminLogin = async (username, password) => {
        const res = await api.post('/auth/admin/login', { username, password });
        setUser({ username, role: 'admin' });
        return res.data;
    };

    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        setUser({
            teamName: data.teamName,
            approvalStatus: 'PENDING',
            lockoutStatus: 'ACTIVE',
            role: 'team'
        });
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch { }
        setUser(null);
    };

    const refreshAuth = async () => {
        try {
            const res = await api.get('/auth/approval-status');
            setUser(prev => ({
                ...prev,
                approvalStatus: res.data.approvalStatus,
                lockoutStatus: res.data.lockoutStatus
            }));
        } catch { }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, adminLogin, register, logout, refreshAuth, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
