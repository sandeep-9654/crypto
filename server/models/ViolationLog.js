const mongoose = require('mongoose');

const violationLogSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    teamName: { type: String },
    violationType: {
        type: String,
        enum: ['TAB_SWITCH', 'WINDOW_BLUR', 'CONNECTIVITY_LOSS',
            'POWER_LOSS', 'LOCKOUT_TRIGGERED', 'ADMIN_REINSTATED']
    },
    details: { type: String },
    occurredAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolvedBy: { type: String }
});

module.exports = mongoose.model('ViolationLog', violationLogSchema);
