import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import GlitchText from '../../components/GlitchText';

const LiveMonitor = () => {
    const { socket } = useSocket();
    const [teams, setTeams] = useState([]);

    const fetchMonitor = React.useCallback(() => {
        api.get('/admin/monitor').then(res => setTeams(res.data.teams)).catch(() => { });
    }, []);

    useEffect(() => {
        fetchMonitor();
        const i = setInterval(fetchMonitor, 5000);
        return () => clearInterval(i);
    }, [fetchMonitor]);

    useEffect(() => {
        if (!socket) return;

        socket.on('team:violation', fetchMonitor);
        socket.on('team:locked', fetchMonitor);
        socket.on('team:reinstated', fetchMonitor);
        socket.on('team:completed', fetchMonitor);
        socket.on('team:connectivity_lost', fetchMonitor);
        socket.on('team:connectivity_restored', fetchMonitor);
        socket.on('leaderboard:update', fetchMonitor); // Update scores in real-time

        return () => {
            socket.off('team:violation', fetchMonitor);
            socket.off('team:locked', fetchMonitor);
            socket.off('team:reinstated', fetchMonitor);
            socket.off('team:completed', fetchMonitor);
            socket.off('team:connectivity_lost', fetchMonitor);
            socket.off('team:connectivity_restored', fetchMonitor);
            socket.off('leaderboard:update', fetchMonitor);
        };
    }, [socket, fetchMonitor]);

    const statusColor = (t) => {
        if (t.lockoutStatus === 'LOCKED') return 'border-danger-red bg-danger-red/5';
        if (t.isFinished) return 'border-neon-green bg-neon-green/5';
        return 'border-terminal-border';
    };

    return (
        <div className="min-h-screen bg-hacker-black p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <GlitchText text="LIVE MONITOR" tag="h1" className="text-2xl text-neon-green" />
                    <Link to="/admin/dashboard" className="btn-cyan text-xs no-underline">BACK</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {teams.map(team => (
                        <div key={team._id} className={`terminal-card ${statusColor(team)}`}>
                            <div className="terminal-header">
                                <div className={`terminal-dot ${team.lockoutStatus === 'LOCKED' ? 'red' : team.isFinished ? 'green' : 'yellow'}`} />
                                <span className="text-neon-green text-xs ml-2">{team.teamName}</span>
                            </div>
                            <div className="p-4 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-electric-cyan">Score:</span>
                                    <span className="text-neon-green font-bold">{team.totalScore}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-electric-cyan">Round:</span>
                                    <span className="text-neon-green">{team.currentRound}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-electric-cyan">Question:</span>
                                    <span className="text-neon-green">{team.currentQuestionIndex + 1}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-electric-cyan">Violations:</span>
                                    <span className={team.tabViolations > 0 ? 'text-danger-red' : 'text-neon-green'}>{team.tabViolations}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-electric-cyan">Status:</span>
                                    <span className={team.lockoutStatus === 'LOCKED' ? 'text-danger-red' : team.isFinished ? 'text-neon-green' : 'text-warning-yellow'}>
                                        {team.isFinished ? '✓ FINISHED' : team.lockoutStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LiveMonitor;
