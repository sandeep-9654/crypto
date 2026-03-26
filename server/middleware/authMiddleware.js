const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.cookies.auth_token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) {
        return res.status(401).json({ error: 'AUTHENTICATION_REQUIRED' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.teamId = decoded.teamId;
        req.teamName = decoded.teamName;
        req.role = decoded.role;
        req.approvalStatus = decoded.approvalStatus;
        req.lockoutStatus = decoded.lockoutStatus;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'INVALID_TOKEN' });
    }
};

module.exports = authMiddleware;
