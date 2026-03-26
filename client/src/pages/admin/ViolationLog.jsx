import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import GlitchText from '../../components/GlitchText';
import TerminalCard from '../../components/TerminalCard';

const ViolationLog = () => {
    const { socket } = useSocket();
    const [violations, setViolations] = useState([]);
    const [lockedTeams, setLockedTeams] = useState([]);

    // Modal state for reinstatement
    const [reinstateModal, setReinstateModal] = useState(null);
    const [reinstateNote, setReinstateNote] = useState('');
    const [compensationMins, setCompensationMins] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            // Fetch violations and monitor data in parallel
            const [vRes, mRes] = await Promise.all([
                api.get('/admin/violations'),
                api.get('/admin/monitor')
            ]);
            setViolations(vRes.data.violations);
            // Filter strictly for LOCKED teams from the monitor endpoint
            setLockedTeams(mRes.data.teams.filter(t => t.lockoutStatus === 'LOCKED'));
        } catch { }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Listen to socket events to keep violations and locked teams updated instantly
    useEffect(() => {
        if (!socket) return;
        socket.on('team:violation', fetchData);
        socket.on('team:locked', fetchData);
        socket.on('team:reinstated', fetchData);
        return () => {
            socket.off('team:violation', fetchData);
            socket.off('team:locked', fetchData);
            socket.off('team:reinstated', fetchData);
        };
    }, [socket, fetchData]);

    const handleReinstate = async () => {
        if (!reinstateModal) return;
        try {
            await api.put(`/admin/teams/${reinstateModal._id}/reinstate`, {
                note: reinstateNote,
                compensationMinutes: parseInt(compensationMins) || 0
            });
            setReinstateModal(null);
            setReinstateNote('');
            setCompensationMins(0);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to reinstate team');
        }
    };

    const typeColor = (type) => {
        if (type === 'TAB_SWITCH' || type === 'WINDOW_BLUR') return 'text-warning-yellow';
        if (type === 'LOCKOUT_TRIGGERED') return 'text-danger-red';
        if (type === 'ADMIN_REINSTATED') return 'text-neon-green';
        return 'text-electric-cyan';
    };

    return (
        <div className="min-h-screen bg-hacker-black p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <GlitchText text="VIOLATION LOG & REINSTATEMENT" tag="h1" className="text-2xl text-danger-red" />
                    <Link to="/admin/dashboard" className="btn-cyan text-xs no-underline">BACK</Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN: ACTIVE LOCKED TEAMS */}
                    <div>
                        <TerminalCard title="[LOCKED TEAMS AWAITING REINSTATEMENT]">
                            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                                {lockedTeams.map(team => (
                                    <motion.div key={team._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                        <div className="border border-danger-red bg-danger-red/10 p-3 rounded space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-danger-red font-bold animate-pulse">🔒 {team.teamName}</span>
                                                <span className="text-xs text-electric-cyan">Round: {team.currentRound} | Q: {team.currentQuestionIndex + 1}</span>
                                            </div>
                                            <div className="text-xs text-neon-green opacity-70">
                                                Violations: {team.tabViolations} | Score: {team.totalScore}
                                            </div>
                                            <button
                                                onClick={() => setReinstateModal(team)}
                                                className="btn-cyan text-xs w-full py-2"
                                            >
                                                REINSTATE_TEAM
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                                {lockedTeams.length === 0 && (
                                    <div className="text-center text-neon-green opacity-50 py-8 border border-dashed border-terminal-border rounded">
                                        No teams currently locked
                                    </div>
                                )}
                            </div>
                        </TerminalCard>
                    </div>

                    {/* RIGHT COLUMN: ALL HISTORICAL VIOLATIONS */}
                    <div>
                        <TerminalCard title="[HISTORICAL SECURITY EVENTS]">
                            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                                {violations.map(v => (
                                    <div key={v._id} className="border-b border-terminal-border pb-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className={typeColor(v.violationType)}>{v.violationType}</span>
                                            <span className="text-neon-green text-xs opacity-50">{new Date(v.occurredAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-neon-green opacity-70 text-xs mt-1">
                                            Team: <span className="text-electric-cyan">{v.teamName}</span> {v.details && `— ${v.details}`}
                                        </p>
                                        {v.resolvedBy && (
                                            <p className="text-neon-green opacity-40 text-xs mt-1">Action by: {v.resolvedBy}</p>
                                        )}
                                    </div>
                                ))}
                                {violations.length === 0 && (
                                    <div className="text-center text-neon-green opacity-50 py-8">No violations recorded</div>
                                )}
                            </div>
                        </TerminalCard>
                    </div>
                </div>

                {/* REINSTATEMENT MODAL */}
                {reinstateModal && (
                    <div className="fullscreen-overlay" onClick={() => setReinstateModal(null)}>
                        <TerminalCard title={`[REINSTATE: ${reinstateModal.teamName}]`} className="max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-electric-cyan text-xs mb-1">AUTHORIZATION NOTE (Required):</label>
                                    <input
                                        type="text"
                                        value={reinstateNote}
                                        onChange={e => setReinstateNote(e.target.value)}
                                        className="terminal-input"
                                        placeholder="Admin verbal verification confirmed..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-electric-cyan text-xs mb-1">COMPENSATION TIME (+Minutes):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        value={compensationMins}
                                        onChange={e => setCompensationMins(e.target.value)}
                                        className="terminal-input"
                                    />
                                    <p className="text-neon-green opacity-50 text-[10px] mt-1">Adds extra time to team's clock upon reinstatement</p>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-terminal-border">
                                    <button
                                        onClick={handleReinstate}
                                        disabled={!reinstateNote.trim()}
                                        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        CONFIRM_ACCESS
                                    </button>
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

export default ViolationLog;
