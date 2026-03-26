const jwt = require('jsonwebtoken');

const adminMiddleware = (req, res, next) => {
    const token = req.cookies.auth_token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) {
        return res.status(401).json({ error: 'AUTHENTICATION_REQUIRED' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'ADMIN_ACCESS_REQUIRED' });
        }
        req.adminId = decoded.adminId;
        req.adminUsername = decoded.username;
        req.role = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'INVALID_TOKEN' });
    }
};

module.exports = adminMiddleware;
