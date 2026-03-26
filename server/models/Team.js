const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const participantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    registerNumber: { type: String, required: true, trim: true },
    year: { type: String, enum: ['1', '2', '3', '4'] },
    department: { type: String, trim: true },
    section: { type: Number }
}, { _id: false });

const teamSchema = new mongoose.Schema({
    teamName: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    participants: {
        type: [participantSchema],
        validate: [arr => arr.length >= 2 && arr.length <= 4, 'Team must have 2-4 participants']
    },

    // Approval System
    approvalStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    approvedAt: { type: Date },
    approvedBy: { type: String },
    rejectionReason: { type: String },

    // Competition Progress
    currentRound: { type: Number, default: 1 },
    currentQuestionIndex: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    startTime: { type: Date },
    endTime: { type: Date },
    timeTakenSeconds: { type: Number },
    isFinished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Lockout System
    lockoutStatus: {
        type: String,
        enum: ['ACTIVE', 'LOCKED', 'REINSTATED'],
        default: 'ACTIVE'
    },
    lockedAt: { type: Date },
    lockReason: {
        type: String,
        enum: ['TAB_SWITCH', 'CONNECTIVITY_LOSS', 'POWER_LOSS', 'ADMIN_MANUAL', null],
        default: null
    },
    lockViolationCount: { type: Number, default: 0 },
    reinstatedAt: { type: Date },
    reinstatedBy: { type: String },
    reinstateNote: { type: String },
    tabViolations: { type: Number, default: 0 },
    connectivityLostAt: { type: Date },
    graceExpiresAt: { type: Date },

    createdAt: { type: Date, default: Date.now }
});

teamSchema.index({ totalScore: -1, timeTakenSeconds: 1 });
teamSchema.index({ approvalStatus: 1 });
teamSchema.index({ lockoutStatus: 1 });

teamSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
});

teamSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('Team', teamSchema);
