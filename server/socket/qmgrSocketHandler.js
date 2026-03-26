const logger = require('../utils/logger');

module.exports = (io) => {
    // QM-specific socket events are handled through the main socket handler
    // This module provides helper functions for QM-related emissions

    const emitQuestionUpdate = (questionId, affectedTeams, liveSwap = false) => {
        io.to('admin').emit('qmgr:question_updated', { questionId, affectedTeams, liveSwap });
    };

    const emitQuestionSetReplaced = () => {
        // Notify all connected teams that the question set has been replaced
        io.emit('question:set_replaced', {
            message: '[ QUESTION SET UPDATED — RESTARTING ]'
        });
    };

    return {
        emitQuestionUpdate,
        emitQuestionSetReplaced
    };
};
