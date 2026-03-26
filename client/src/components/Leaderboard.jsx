import React from 'react';
import { motion } from 'framer-motion';

const Leaderboard = ({ teams = [] }) => (
    <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs text-electric-cyan opacity-70 px-4 py-2">
            <div className="col-span-1">#</div>
            <div className="col-span-5">TEAM</div>
            <div className="col-span-2">SCORE</div>
            <div className="col-span-2">ROUND</div>
            <div className="col-span-2">STATUS</div>
        </div>
        {teams.map((team, index) => (
            <motion.div
                key={team.teamName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`grid grid-cols-12 gap-2 px-4 py-3 border border-terminal-border rounded ${index === 0 ? 'border-neon-green bg-neon-green/5' :
                        index < 3 ? 'border-electric-cyan/50' : ''
                    }`}
            >
                <div className="col-span-1 text-warning-yellow font-bold">{team.rank || index + 1}</div>
                <div className="col-span-5 text-neon-green truncate">{team.teamName}</div>
                <div className="col-span-2 text-electric-cyan font-bold">{team.totalScore}</div>
                <div className="col-span-2 text-neon-green opacity-70">R{team.currentRound}</div>
                <div className="col-span-2">
                    {team.isFinished ? (
                        <span className="text-neon-green text-xs">✓ DONE</span>
                    ) : (
                        <span className="text-warning-yellow text-xs">● ACTIVE</span>
                    )}
                </div>
            </motion.div>
        ))}
        {teams.length === 0 && (
            <div className="text-center text-neon-green opacity-50 py-8">
                {'>'} No teams on the leaderboard yet...
            </div>
        )}
    </div>
);

export default Leaderboard;
