const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    adminUsername: { type: String },
    qmgrToken: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 2 * 60 * 60 * 1000)
    },
    isRevoked: { type: Boolean, default: false },
    lastUsedAt: { type: Date }
});

// TTL index — MongoDB auto-deletes expired sessions
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminSession', adminSessionSchema);
