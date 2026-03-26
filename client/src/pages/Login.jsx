import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlitchText from '../components/GlitchText';
import TerminalCard from '../components/TerminalCard';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If already logged in, redirect
    React.useEffect(() => {
        if (user && user.role === 'team' && user.approvalStatus === 'APPROVED') {
            navigate('/dashboard', { replace: true });
        } else if (user && user.role === 'team' && user.approvalStatus === 'PENDING') {
            navigate('/pending', { replace: true });
        } else if (user && user.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(teamName, password);
            if (data.approvalStatus === 'PENDING') {
                navigate('/pending');
            } else if (data.approvalStatus === 'REJECTED') {
                setError('Your registration was rejected. Contact the admin.');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-hacker-black relative">
            <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <GlitchText text="TEAM LOGIN" tag="h1" className="text-3xl text-neon-green" />
                    </div>
                    <TerminalCard title="[AUTHENTICATION]">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && <div className="text-danger-red text-sm border border-danger-red p-3 rounded">✗ {error}</div>}
                            <div className="space-y-2">
                                <label className="block text-electric-cyan text-xs">TEAM_NAME:</label>
                                <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
                                    className="terminal-input" placeholder="ALPHA_SQUAD" required />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-electric-cyan text-xs">PASSWORD:</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    className="terminal-input" placeholder="••••••••" required />
                            </div>
                            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                                {loading ? 'AUTHENTICATING...' : '>> AUTHENTICATE'}
                            </button>
                            <div className="text-center">
                                <Link to="/register" className="text-electric-cyan text-xs hover:underline">
                                    {'>'} REGISTER NEW TEAM
                                </Link>
                            </div>
                        </form>
                    </TerminalCard>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
