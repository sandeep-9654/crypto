const mongoose = require('mongoose');

const teamAnswerSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    roundNumber: { type: Number },
    submittedAnswer: { type: String },
    isCorrect: { type: Boolean },
    pointsAwarded: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1 },
    hintRevealed: { type: Boolean, default: false },
    attemptedAt: { type: Date, default: Date.now }
});

teamAnswerSchema.index({ teamId: 1, questionId: 1 });

module.exports = mongoose.model('TeamAnswer', teamAnswerSchema);
