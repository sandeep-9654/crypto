import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import GlitchText from '../../components/GlitchText';
import TerminalCard from '../../components/TerminalCard';
import ApprovalStatusBadge from '../../components/ApprovalStatusBadge';

const TeamApprovals = () => {
    const { socket } = useSocket();
    const [teams, setTeams] = useState([]);
    const [filter, setFilter] = useState('PENDING');
    const [rejectModal, setRejectModal] = useState(null);
    const [reason, setReason] = useState('');

    const fetchTeams = React.useCallback(async () => {
        try {
            const res = await api.get(`/admin/approvals?status=${filter}`);
            setTeams(res.data.teams);
        } catch { }
    }, [filter]);

    useEffect(() => {
        fetchTeams();
        const interval = setInterval(fetchTeams, 10000);
        return () => clearInterval(interval);
    }, [fetchTeams]);

    useEffect(() => {
        if (!socket) return;
        socket.on('team:registered', fetchTeams);
        socket.on('team:approved', fetchTeams);
        return () => {
            socket.off('team:registered');
            socket.off('team:approved');
        };
    }, [socket, fetchTeams]);

    const approve = async (id) => {
        await api.put(`/admin/approvals/${id}/approve`);
        fetchTeams();
    };

    const reject = async () => {
        if (!rejectModal) return;
        await api.put(`/admin/approvals/${rejectModal}/reject`, { reason });
        setRejectModal(null);
        setReason('');
        fetchTeams();
    };

    const revoke = async (id) => {
        await api.put(`/admin/approvals/${id}/revoke`);
        fetchTeams();
    };

    const approveAll = async () => {
        if (!window.confirm('Approve ALL pending teams?')) return;
        await api.put('/admin/approvals/approve-all');
        fetchTeams();
    };

    return (
        <div className="min-h-screen bg-hacker-black p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <GlitchText text="TEAM APPROVALS" tag="h1" className="text-2xl text-neon-green" />
                    <Link to="/admin/dashboard" className="btn-cyan text-xs no-underline">BACK</Link>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(tab => (
                        <button key={tab} onClick={() => setFilter(tab)}
                            className={`px-4 py-2 text-xs border ${filter === tab ? 'border-neon-green text-neon-green bg-neon-green/10' : 'border-terminal-border text-neon-green/50'}`}>
                            {tab}
                        </button>
                    ))}
                    <button onClick={approveAll} className="btn-primary text-xs ml-auto">APPROVE_ALL_PENDING</button>
                </div>

                {/* Team List */}
                <div className="space-y-3">
                    {teams.map((team) => (
                        <motion.div key={team._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <TerminalCard title={`[TEAM: ${team.teamName}]`}>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <ApprovalStatusBadge status={team.approvalStatus} />
                                        <span className="text-xs text-neon-green opacity-50">
                                            {new Date(team.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="text-xs space-y-1">
                                        <p className="text-electric-cyan">Members ({team.participants?.length}):</p>
                                        {team.participants?.map((p, i) => (
                                            <p key={i} className="text-neon-green opacity-70 ml-4">
                                                {p.name} — {p.registerNumber} (Y{p.year} {p.department} Sec-{p.section})
                                            </p>
                                        ))}
                                    </div>

                                    {team.rejectionReason && (
                                        <p className="text-danger-red text-xs">Reason: {team.rejectionReason}</p>
                                    )}

                                    <div className="flex gap-2 pt-2 border-t border-terminal-border">
                                        {team.approvalStatus === 'PENDING' && (
                                            <>
                                                <button onClick={() => approve(team._id)} className="btn-primary text-xs">APPROVE</button>
                                                <button onClick={() => setRejectModal(team._id)} className="btn-danger text-xs">REJECT</button>
                                            </>
                                        )}
                                        {team.approvalStatus === 'APPROVED' && (
                                            <button onClick={() => revoke(team._id)} className="btn-danger text-xs">REVOKE</button>
                                        )}
                                    </div>
                                </div>
                            </TerminalCard>
                        </motion.div>
                    ))}
                    {teams.length === 0 && (
                        <div className="text-center text-neon-green opacity-50 py-8">No teams in this category</div>
                    )}
                </div>

                {/* Reject Modal */}
                {rejectModal && (
                    <div className="fullscreen-overlay" onClick={() => setRejectModal(null)}>
                        <TerminalCard title="[REJECT TEAM]" className="max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                            <div className="space-y-4">
                                <label className="block text-electric-cyan text-xs">REJECTION REASON (optional):</label>
                                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                                    className="terminal-input" placeholder="Enter reason..." />
                                <div className="flex gap-2">
                                    <button onClick={reject} className="btn-danger flex-1">CONFIRM_REJECT</button>
                                    <button onClick={() => setRejectModal(null)} className="btn-cyan flex-1">CANCEL</button>
                                </div>
                            </div>
                        </TerminalCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamApprovals;
