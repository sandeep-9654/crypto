import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlitchText from '../components/GlitchText';
import TerminalCard from '../components/TerminalCard';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [password, setPassword] = useState('');
    const [participants, setParticipants] = useState([
        { name: '', registerNumber: '', year: '1', department: '', section: '' }
    ]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const addParticipant = () => {
        if (participants.length < 3) {
            setParticipants([...participants, { name: '', registerNumber: '', year: '1', department: '', section: '' }]);
        }
    };

    const removeParticipant = (index) => {
        if (participants.length > 1) {
            setParticipants(participants.filter((_, i) => i !== index));
        }
    };

    const updateParticipant = (index, field, value) => {
        const updated = [...participants];
        updated[index][field] = value;
        setParticipants(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register({ teamName, password, participants });
            navigate('/pending');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-hacker-black relative">
            <div className="relative z-10 container mx-auto px-4 py-12">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <GlitchText text="TEAM REGISTRATION" tag="h1" className="text-3xl text-neon-green" />
                </motion.div>

                <TerminalCard title="[REGISTER NEW TEAM]" className="max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="text-danger-red text-sm border border-danger-red p-3 rounded">✗ {error}</div>}

                        <div className="space-y-2">
                            <label className="block text-electric-cyan text-xs">TEAM_NAME:</label>
                            <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
                                className="terminal-input" placeholder="ALPHA_SQUAD" maxLength={30} required />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-electric-cyan text-xs">PASSWORD:</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                className="terminal-input" placeholder="min 8 characters" minLength={8} maxLength={64} required />
                        </div>

                        <div className="border-t border-terminal-border pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-electric-cyan text-xs">PARTICIPANTS ({participants.length}/3):</span>
                                {participants.length < 3 && (
                                    <button type="button" onClick={addParticipant} className="btn-cyan text-xs px-3 py-1">ADD_MEMBER</button>
                                )}
                            </div>

                            {participants.map((p, i) => (
                                <div key={i} className="border border-terminal-border rounded p-4 mb-3">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-neon-green text-xs">MEMBER_{i + 1}</span>
                                        {participants.length > 1 && (
                                            <button type="button" onClick={() => removeParticipant(i)} className="text-danger-red text-xs hover:underline">REMOVE</button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="text" value={p.name} onChange={e => updateParticipant(i, 'name', e.target.value)}
                                            className="terminal-input text-sm" placeholder="Full Name" required />
                                        <input type="text" value={p.registerNumber} onChange={e => updateParticipant(i, 'registerNumber', e.target.value)}
                                            className="terminal-input text-sm" placeholder="Register No." maxLength={15} required />
                                        <select value={p.year} onChange={e => updateParticipant(i, 'year', e.target.value)}
                                            className="terminal-input text-sm bg-terminal-dark">
                                            <option value="1">Year 1</option><option value="2">Year 2</option>
                                            <option value="3">Year 3</option><option value="4">Year 4</option>
                                        </select>
                                        <select value={p.department} onChange={e => updateParticipant(i, 'department', e.target.value)}
                                            className="terminal-input text-sm bg-terminal-dark">
                                            <option value="">— Dept —</option>
                                            <option value="CSE">CSE</option>
                                            <option value="CSM">CSM</option>
                                            <option value="CAI">CAI</option>
                                            <option value="CSD">CSD</option>
                                            <option value="IT">IT</option>
                                            <option value="ECE">ECE</option>
                                            <option value="EEE">EEE</option>
                                        </select>
                                        <input type="number" value={p.section} onChange={e => updateParticipant(i, 'section', e.target.value)}
                                            className="terminal-input text-sm" placeholder="Section" min={1} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                            {loading ? 'PROCESSING...' : 'REGISTER_TEAM'}
                        </button>
                    </form>
                </TerminalCard>
            </div>
        </div>
    );
};

export default Register;
