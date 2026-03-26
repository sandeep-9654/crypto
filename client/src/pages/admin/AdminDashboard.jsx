import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import GlitchText from '../../components/GlitchText';
import TerminalCard from '../../components/TerminalCard';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const { socket } = useSocket();
    const [stats, setStats] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [rounds, setRounds] = useState([]);
    const [roundLoading, setRoundLoading] = useState({});
    const [lastUpdate, setLastUpdate] = useState(null);

    const fetchData = useCallback(() => {
        api.get('/admin/dashboard').then(res => {
            setStats(res.data);
            setPendingCount(res.data.pendingTeams);
            if (res.data.rounds) setRounds(res.data.rounds);
            setLastUpdate(new Date().toLocaleTimeString());
        }).catch(() => { });
    }, []);

    // Initial fetch
    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-poll every 10 seconds for real-time accuracy
    useEffect(() => {
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Comprehensive WebSocket listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        // Team registration & approval events
        socket.on('team:registered', () => {
            setPendingCount(p => p + 1);
            fetchData();
        });
        socket.on('team:approved', () => {
            setPendingCount(p => Math.max(0, p - 1));
            fetchData();
        });

        // Team state change events
        socket.on('team:locked', () => fetchData());
        socket.on('team:reinstated', () => fetchData());
        socket.on('team:completed', () => fetchData());

        // Round events
        socket.on('round:activated', () => fetchData());

        // Leaderboard updates (team answered correctly)
        socket.on('leaderboard:update', () => fetchData());

        return () => {
            socket.off('team:registered');
            socket.off('team:approved');
            socket.off('team:locked');
            socket.off('team:reinstated');
            socket.off('team:completed');
            socket.off('round:activated');
            socket.off('leaderboard:update');
        };
    }, [socket, fetchData]);

    const toggleRound = async (roundNum) => {
        setRoundLoading(prev => ({ ...prev, [roundNum]: true }));
        try {
            await api.post(`/admin/round/${roundNum}/toggle`);
            // Immediately update local state for instant feedback
            setRounds(prev => prev.map(r =>
                r.roundNumber === roundNum ? { ...r, isActive: !r.isActive } : r
            ));
            // Then fetch fresh data from server
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to toggle round');
        } finally {
            setRoundLoading(prev => ({ ...prev, [roundNum]: false }));
        }
    };

    const statCards = stats ? [
        { label: 'Total Teams', value: stats.totalTeams, color: 'text-neon-green' },
        { label: 'Pending', value: pendingCount, color: 'text-warning-yellow' },
        { label: 'Approved', value: stats.approvedTeams, color: 'text-electric-cyan' },
        { label: 'Locked', value: stats.lockedTeams, color: 'text-danger-red' },
        { label: 'Finished', value: stats.finishedTeams, color: 'text-neon-green' },
        { label: 'Questions', value: stats.totalQuestions, color: 'text-electric-cyan' }
    ] : [];

    const navLinks = [
        { to: '/admin/approvals', label: 'TEAM_APPROVALS', badge: pendingCount > 0 ? pendingCount : null },
        { to: '/admin/teams', label: 'TEAM_MANAGER' },
        { to: '/admin/monitor', label: 'LIVE_MONITOR' },
        { to: '/admin/violations', label: 'VIOLATION_LOG' },
        { to: '/ctrl/qmgr', label: 'QUESTION_MANAGER' }
    ];

    return (
        <div className="min-h-screen bg-hacker-black p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <GlitchText text="ADMIN CONSOLE" tag="h1" className="text-2xl text-danger-red" />
                    <div className="flex items-center gap-4">
                        {lastUpdate && (
                            <span className="text-xs text-neon-green opacity-50">
                                Updated: {lastUpdate}
                            </span>
                        )}
                        <button onClick={fetchData} className="btn-cyan text-xs">REFRESH</button>
                        <button onClick={logout} className="btn-danger text-xs">LOGOUT</button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                    {statCards.map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}>
                            <TerminalCard title="" className="text-center py-2">
                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                <div className="text-xs text-neon-green opacity-50 mt-1">{stat.label}</div>
                            </TerminalCard>
                        </motion.div>
                    ))}
                </div>

                {/* Active Round */}
                {stats?.activeRound && (
                    <TerminalCard title="[ACTIVE ROUND]" className="mb-8">
                        <p className="text-neon-green">
                            Round {stats.activeRound.roundNumber}: {stats.activeRound.roundName}
                        </p>
                    </TerminalCard>
                )}

                {/* Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {navLinks.map(link => (
                        <Link key={link.to} to={link.to} className="no-underline">
                            <TerminalCard title="" className="hover:border-neon-green transition-colors cursor-pointer">
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-neon-green">{'>'} {link.label}</span>
                                    {link.badge && (
                                        <span className="bg-danger-red text-hacker-black px-2 py-1 rounded text-xs font-bold animate-pulse">
                                            {link.badge}
                                        </span>
                                    )}
                                </div>
                            </TerminalCard>
                        </Link>
                    ))}
                </div>

                {/* Round Controls with Lock/Unlock */}
                <div className="mt-8">
                    <TerminalCard title="[ROUND CONTROLS]">
                        <div className="space-y-4">
                            {[1, 2].map(roundNum => {
                                const round = rounds.find(r => r.roundNumber === roundNum);
                                const isActive = round?.isActive || false;
                                return (
                                    <div key={roundNum} className="flex items-center justify-between border border-terminal-border rounded p-4">
                                        <div className="flex items-center gap-4">
                                            <span className={`text-2xl ${isActive ? 'text-neon-green' : 'text-danger-red'}`}>
                                                {isActive ? '🔓' : '🔒'}
                                            </span>
                                            <div>
                                                <p className="text-neon-green text-sm">
                                                    ROUND {roundNum}{round ? `: ${round.roundName}` : ''}
                                                </p>
                                                <p className={`text-xs ${isActive ? 'text-neon-green' : 'text-danger-red'}`}>
                                                    Status: {isActive ? 'UNLOCKED (Active)' : 'LOCKED (Inactive)'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleRound(roundNum)}
                                            disabled={roundLoading[roundNum]}
                                            className={`px-6 py-2 text-xs font-bold rounded border ${isActive
                                                ? 'border-danger-red text-danger-red hover:bg-danger-red hover:text-hacker-black'
                                                : 'border-neon-green text-neon-green hover:bg-neon-green hover:text-hacker-black'
                                                } transition-colors`}
                                        >
                                            {roundLoading[roundNum] ? 'PROCESSING...' : isActive ? '🔒 LOCK' : '🔓 UNLOCK'}
                                        </button>
                                    </div>
                                );
                            })}

                            <div className="pt-3 border-t border-terminal-border">
                                <button onClick={async () => {
                                    try {
                                        const res = await api.get('/admin/export', { responseType: 'blob' });
                                        const url = window.URL.createObjectURL(new Blob([res.data]));
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'cryptohunt_results.csv';
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                    } catch { alert('Export failed'); }
                                }} className="btn-cyan text-xs">EXPORT_CSV</button>
                            </div>
                        </div>
                    </TerminalCard>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
