const AdminSession = require('../models/AdminSession');

const verifyQmgrToken = async (req, res, next) => {
    const token = req.cookies.qmgr_token;

    // Always return 404 — never reveal the route exists
    if (!token) {
        return res.status(404).json({ error: 'NOT_FOUND' });
    }

    try {
        const session = await AdminSession.findOne({
            qmgrToken: token,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            return res.status(404).json({ error: 'NOT_FOUND' });
        }

        await AdminSession.findByIdAndUpdate(session._id, {
            lastUsedAt: new Date()
        });

        req.adminSession = session;
        next();
    } catch (err) {
        return res.status(404).json({ error: 'NOT_FOUND' });
    }
};

module.exports = verifyQmgrToken;
