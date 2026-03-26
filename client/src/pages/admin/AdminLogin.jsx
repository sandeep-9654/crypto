import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlitchText from '../../components/GlitchText';
import TerminalCard from '../../components/TerminalCard';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { adminLogin } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await adminLogin(username, password);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-hacker-black relative">
            <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <GlitchText text="ADMIN ACCESS" tag="h1" className="text-3xl text-danger-red" />
                    </div>
                    <TerminalCard title="[ADMIN AUTHENTICATION]">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && <div className="text-danger-red text-sm border border-danger-red p-3 rounded">✗ {error}</div>}
                            <div className="space-y-2">
                                <label className="block text-electric-cyan text-xs">USERNAME:</label>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                    className="terminal-input" placeholder="admin" required />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-electric-cyan text-xs">PASSWORD:</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    className="terminal-input" placeholder="••••••••" required />
                            </div>
                            <button type="submit" className="btn-danger w-full py-3" disabled={loading}>
                                {loading ? 'AUTHENTICATING...' : 'AUTHORIZE_ACCESS'}
                            </button>
                        </form>
                    </TerminalCard>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLogin;
