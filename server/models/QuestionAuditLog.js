const mongoose = require('mongoose');

const questionAuditLogSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    roundNumber: { type: Number },
    action: {
        type: String,
        enum: ['CREATED', 'UPDATED', 'DELETED', 'REORDERED',
            'LIVE_SWAPPED', 'BULK_IMPORTED', 'ROUND_TOGGLED']
    },
    performedBy: { type: String },
    previousState: { type: Object },
    newState: { type: Object },
    changedFields: [{ type: String }],
    affectedTeams: { type: Number },
    liveSwap: { type: Boolean, default: false },
    performedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    sessionToken: { type: String }
});

module.exports = mongoose.model('QuestionAuditLog', questionAuditLogSchema);
