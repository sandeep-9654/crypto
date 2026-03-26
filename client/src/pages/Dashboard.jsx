import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import useAntiCheat from '../hooks/useAntiCheat';
import useConnectionMonitor from '../hooks/useConnectionMonitor';
import TerminalCard from '../components/TerminalCard';
import GlitchText from '../components/GlitchText';
import BombTimer from '../components/BombTimer';
import CipherBadge from '../components/CipherBadge';
import AnswerInput from '../components/AnswerInput';
import ViolationWarningOverlay from '../components/ViolationWarningOverlay';
import LockoutScreen from '../components/LockoutScreen';
import ConnectivityOverlay from '../components/ConnectivityOverlay';

const Dashboard = () => {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [dashData, setDashData] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState(null);



    const { violationCount, showWarning, isLocked: antiCheatLocked, acknowledgeWarning } = useAntiCheat(
        dashData?.teamId, socket
    );
    const { isOffline, graceExpired, onGraceExpired } = useConnectionMonitor(dashData?.teamId, socket);

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await api.get('/team/dashboard');
            setDashData(res.data);
            setLoading(false);
        } catch (err) {
            if (err.response?.status === 423) {
                setDashData({ locked: true, lockReason: err.response.data.lockReason });
            } else if (err.response?.status === 403) {
                navigate('/pending');
            }
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('lockout:activated', (data) => {
            setDashData(prev => ({ ...prev, locked: true, lockReason: data.reason }));
        });

        socket.on('lockout:reinstated', () => {
            setBanner({ text: '✓ ACCESS RESTORED — RESUMING MISSION', color: 'text-neon-green' });
            fetchDashboard(); // Fetch new compensated timer instantly
            setTimeout(() => { setBanner(null); }, 3000);
        });

        socket.on('question:live_updated', () => {
            setBanner({ text: '[ QUESTION UPDATED — REFRESHING ]', color: 'text-electric-cyan' });
            setTimeout(() => { fetchDashboard(); setBanner(null); }, 1500);
        });

        socket.on('question:set_replaced', () => {
            setBanner({ text: '[ QUESTION SET UPDATED — RESTARTING ]', color: 'text-warning-yellow' });
            setTimeout(() => window.location.reload(), 3000);
        });

        socket.on('round:activated', () => {
            fetchDashboard();
        });

        return () => {
            socket.off('lockout:activated');
            socket.off('lockout:reinstated');
            socket.off('question:live_updated');
            socket.off('question:set_replaced');
            socket.off('round:activated');
        };
    }, [socket, fetchDashboard]);

    const handleAnswer = async (answer) => {
        if (!dashData?.question?._id) return;
        setSubmitting(true);
        setFeedback(null);

        try {
            const res = await api.post('/team/answer', {
                questionId: dashData.question._id,
                answer
            });

            if (res.data.result === 'CORRECT') {
                setFeedback({ type: 'success', message: `✓ DECRYPTED — +${res.data.pointsAwarded} pts` });
                if (res.data.isFinished) {
                    setTimeout(() => navigate('/complete'), 2000);
                } else if (res.data.roundComplete) {
                    setTimeout(() => navigate('/round-complete'), 2000);
                } else {
                    setTimeout(fetchDashboard, 1500);
                }
            } else {
                let msg = `✗ ACCESS_DENIED — Attempt ${res.data.attemptNumber}`;
                if (res.data.hintLetter) msg += ` | Hint: contains "${res.data.hintLetter}"`;
                setFeedback({ type: 'error', message: msg });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.error || 'SUBMISSION_ERROR' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-hacker-black flex items-center justify-center">
                <div className="text-neon-green"><span className="terminal-spinner"></span> LOADING MISSION...</div>
            </div>
        );
    }

    if (dashData?.locked || antiCheatLocked || graceExpired) {
        return <LockoutScreen reason={dashData?.lockReason || 'TAB_SWITCH'} violationCount={violationCount} />;
    }

    return (
        <div className="min-h-screen bg-hacker-black p-4 md:p-8">
            {showWarning && <ViolationWarningOverlay violationCount={violationCount} onAcknowledge={acknowledgeWarning} />}
            {isOffline && <ConnectivityOverlay graceSeconds={120} onExpired={onGraceExpired} />}

            <AnimatePresence>
                {banner && (
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                        className={`fixed top-0 left-0 right-0 z-50 text-center py-3 bg-dark-navy border-b border-terminal-border ${banner.color}`}>
                        {banner.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <GlitchText text={dashData?.teamName || 'TEAM'} tag="h1" className="text-2xl text-neon-green" />
                        <p className="text-electric-cyan text-xs mt-1">
                            Round {dashData?.currentRound} | Question {(dashData?.currentQuestionIndex || 0) + 1}/{dashData?.totalQuestions || '?'}
                            | Score: {dashData?.totalScore || 0}
                        </p>
                    </div>
                    {dashData?.timeLimitSeconds && (
                        <BombTimer timeLimitSeconds={dashData.timeLimitSeconds} startTime={dashData.startTime} />
                    )}
                </div>

                {/* Waiting for round */}
                {dashData?.waiting && (
                    <TerminalCard title="[STANDBY]">
                        <div className="text-center py-8">
                            <p className="text-warning-yellow text-xl">ROUND NOT YET ACTIVE</p>
                            <p className="text-neon-green opacity-50 mt-2">{'>'} Waiting for admin to activate round...█</p>
                        </div>
                    </TerminalCard>
                )}

                {/* Round complete */}
                {dashData?.roundComplete && !dashData?.isFinished && (
                    <TerminalCard title="[ROUND COMPLETE]">
                        <div className="text-center py-8">
                            <p className="text-neon-green text-xl">✓ ROUND {dashData.currentRound} COMPLETE</p>
                            <button onClick={() => navigate('/round-complete')} className="btn-primary mt-4">VIEW_RESULTS</button>
                        </div>
                    </TerminalCard>
                )}

                {/* Question */}
                {dashData?.question && !dashData?.waiting && !dashData?.roundComplete && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <TerminalCard title="[DECRYPTING...]">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <CipherBadge type={dashData.question.cipherType} />
                                    {dashData.question.cipherLabel && (
                                        <span className="text-electric-cyan text-xs">{dashData.question.cipherLabel}</span>
                                    )}
                                    <span className="text-warning-yellow text-xs ml-auto">{dashData.question.points} pts</span>
                                </div>

                                {dashData.question.encryptedText && (
                                    <div className="bg-dark-navy p-4 rounded border border-terminal-border">
                                        <p className="text-xs text-electric-cyan mb-2">ENCRYPTED_TEXT:</p>
                                        <p className="text-neon-green text-lg tracking-wider break-all">{dashData.question.encryptedText}</p>
                                    </div>
                                )}

                                {dashData.question.codeSnippet && (
                                    <div className="bg-dark-navy p-4 rounded border border-terminal-border">
                                        <p className="text-xs text-electric-cyan mb-2">CODE_SNIPPET:</p>
                                        <pre className="text-neon-green text-sm overflow-x-auto whitespace-pre-wrap">{dashData.question.codeSnippet}</pre>
                                    </div>
                                )}

                                {dashData.question.imageUrl && (
                                    <div className="bg-dark-navy p-4 rounded border border-terminal-border">
                                        <p className="text-xs text-electric-cyan mb-2">CIPHER_IMAGE:</p>
                                        <img src={dashData.question.imageUrl} alt="Cipher" className="max-w-full rounded" />
                                    </div>
                                )}

                                {dashData.question.hint && (
                                    <p className="text-warning-yellow text-xs">💡 Hint: {dashData.question.hint}</p>
                                )}

                                {dashData.question.hintLetter && (
                                    <p className="text-warning-yellow text-sm border border-warning-yellow p-2 rounded">
                                        🔑 The answer contains the letter: <span className="text-xl font-bold">{dashData.question.hintLetter}</span>
                                    </p>
                                )}

                                <AnswerInput onSubmit={handleAnswer} disabled={submitting} feedback={feedback} />
                            </div>
                        </TerminalCard>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
