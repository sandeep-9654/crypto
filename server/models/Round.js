const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
    roundNumber: { type: Number, required: true, unique: true },
    roundName: { type: String, trim: true },
    isActive: { type: Boolean, default: false },
    timeLimitSeconds: { type: Number, default: 3600 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Round', roundSchema);
