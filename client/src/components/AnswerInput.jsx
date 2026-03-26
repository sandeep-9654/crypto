import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnswerInput = ({ onSubmit, disabled, feedback }) => {
    const [answer, setAnswer] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!answer.trim() || disabled) return;
        onSubmit(answer.trim());
        setAnswer('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="ENTER_DECRYPTED_ANSWER..."
                    className="terminal-input flex-1"
                    disabled={disabled}
                    maxLength={500}
                    autoComplete="off"
                />
                <button type="submit" className="btn-primary" disabled={disabled}>
                    SUBMIT_ANSWER
                </button>
            </div>

            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}
                    >
                        {feedback.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
};

export default AnswerInput;
