import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import GlitchText from '../components/GlitchText';
import TerminalCard from '../components/TerminalCard';

const EventComplete = () => {
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        api.get('/team/progress').then(res => setProgress(res.data)).catch(() => { });
    }, []);

    return (
        <div className="min-h-screen bg-hacker-black relative">
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <TerminalCard title="[MISSION COMPLETE]" className="max-w-lg w-full">
                        <div className="text-center space-y-6 py-4">
                            <GlitchText text="EVENT FINISHED" tag="h2" className="text-4xl text-neon-green" />
                            <div className="feedback-success text-6xl">✓</div>
                            {progress && (
                                <div className="space-y-2 text-sm">
                                    <p className="text-electric-cyan">Team: <span className="text-neon-green">{progress.teamName}</span></p>
                                    <p className="text-electric-cyan">Final Score: <span className="text-neon-green text-xl">{progress.totalScore}</span></p>
                                    <p className="text-electric-cyan">Questions Solved: <span className="text-neon-green">{progress.answeredQuestions?.length || 0}</span></p>
                                </div>
                            )}
                            <Link to="/leaderboard" className="btn-cyan inline-block no-underline">VIEW_LEADERBOARD</Link>
                        </div>
                    </TerminalCard>
                </motion.div>
            </div>
        </div>
    );
};

export default EventComplete;
