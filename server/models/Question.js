const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Round', required: true },
    roundNumber: { type: Number, required: true },
    questionNumber: { type: Number, required: true },
    displayOrder: { type: Number, required: true },
    cipherType: {
        type: String,
        enum: ['CCS', 'VIG', 'AC', 'PLF', 'PCS', 'MORSE', 'CODE', 'GC'],
        required: true
    },
    cipherLabel: { type: String, trim: true },
    encryptedText: { type: String },
    codeSnippet: { type: String },
    imageUrl: { type: String },
    hintLetter: { type: String, select: false },
    hint: { type: String },
    correctAnswer: { type: String, required: true, select: false },
    points: { type: Number, default: 10 },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

questionSchema.index({ roundNumber: 1, displayOrder: 1 });

module.exports = mongoose.model('Question', questionSchema);
