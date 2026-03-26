import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import GlitchText from '../../components/GlitchText';
import TerminalCard from '../../components/TerminalCard';

const TeamManager = () => {
    const [teams, setTeams] = useState([]);
    const [reinstateModal, setReinstateModal] = useState(null);
    const [note, setNote] = useState('');
    const [compensation, setCompensation] = useState(0);

    const fetchTeams = () => api.get('/admin/teams').then(res => setTeams(res.data.teams));
    useEffect(() => { fetchTeams(); }, []);

    const reinstate = async () => {
        await api.put(`/admin/teams/${reinstateModal}/reinstate`, { note, compensationMinutes: compensation });
        setReinstateModal(null);
        setNote('');
        setCompensation(0);
        fetchTeams();
    };

    const lock = async (id) => {
        await api.put(`/admin/teams/${id}/lock`, { reason: 'ADMIN_MANUAL' });
        fetchTeams();
    };

    const reset = async (id) => {
        if (!window.confirm('Reset this team? This clears all progress and answers.')) return;
        await api.put(`/admin/teams/${id}/reset`);
        fetchTeams();
    };

    const lockoutColor = (s) => s === 'LOCKED' ? 'text-danger-red' : s === 'REINSTATED' ? 'text-warning-yellow' : 'text-neon-green';

    return (
        <div className="min-h-screen bg-hacker-black p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <GlitchText text="TEAM MANAGER" tag="h1" className="text-2xl text-neon-green" />
                    <Link to="/admin/dashboard" className="btn-cyan text-xs no-underline">BACK</Link>
                </div>

                <div className="space-y-3">
                    {teams.map(team => (
                        <TerminalCard key={team._id} title={`[${team.teamName}]`}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                <div><span className="text-electric-cyan text-xs">Score:</span> <span className="text-neon-green">{team.totalScore}</span></div>
                                <div><span className="text-electric-cyan text-xs">Round:</span> <span className="text-neon-green">{team.currentRound}</span></div>
                                <div><span className="text-electric-cyan text-xs">Status:</span> <span className={lockoutColor(team.lockoutStatus)}>{team.lockoutStatus}</span></div>
                                <div><span className="text-electric-cyan text-xs">Violations:</span> <span className="text-danger-red">{team.tabViolations}</span></div>
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-terminal-border">
                                {team.lockoutStatus === 'LOCKED' && (
                                    <button onClick={() => setReinstateModal(team._id)} className="btn-primary text-xs">REINSTATE</button>
                                )}
                                {team.lockoutStatus !== 'LOCKED' && (
                                    <button onClick={() => lock(team._id)} className="btn-danger text-xs">LOCK</button>
                                )}
                                <button onClick={() => reset(team._id)} className="btn-cyan text-xs">RESET</button>
                            </div>
                        </TerminalCard>
                    ))}
                </div>

                {reinstateModal && (
                    <div className="fullscreen-overlay" onClick={() => setReinstateModal(null)}>
                        <TerminalCard title="[ADMIN] REINSTATE TEAM" className="max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                            <div className="space-y-4">
                                <label className="block text-electric-cyan text-xs">Reinstatement Note (optional):</label>
                                <input type="text" value={note} onChange={e => setNote(e.target.value)} className="terminal-input" placeholder="Note..." />
                                <label className="block text-electric-cyan text-xs">Time Compensation (minutes):</label>
                                <input type="number" value={compensation} onChange={e => setCompensation(Number(e.target.value))} className="terminal-input" min="0" />
                                <div className="flex gap-2">
                                    <button onClick={reinstate} className="btn-primary flex-1">CONFIRM_REINSTATEMENT</button>
                                    <button onClick={() => setReinstateModal(null)} className="btn-danger flex-1">CANCEL</button>
                                </div>
                            </div>
                        </TerminalCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamManager;
