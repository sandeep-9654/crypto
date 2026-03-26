import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import GlitchText from '../components/GlitchText';
import TerminalCard from '../components/TerminalCard';
import Leaderboard from '../components/Leaderboard';

const PublicLeaderboard = () => {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = () => {
            api.get('/leaderboard').then(res => setTeams(res.data.leaderboard)).catch(() => { });
        };
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-hacker-black relative">
            <div className="relative z-10 container mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <GlitchText text="LIVE LEADERBOARD" tag="h1" className="text-3xl text-neon-green" />
                    <p className="text-electric-cyan text-sm mt-2 opacity-70">Real-time rankings</p>
                </div>

                <TerminalCard title="[RANKINGS]" className="max-w-3xl mx-auto">
                    <Leaderboard teams={teams} />
                </TerminalCard>

                <div className="text-center mt-8">
                    <Link to="/" className="text-electric-cyan hover:text-neon-green text-sm">{'>'} Back to home</Link>
                </div>
            </div>
        </div>
    );
};

export default PublicLeaderboard;
