const QuestionAuditLog = require('../models/QuestionAuditLog');
const logger = require('../utils/logger');

const logQmgrAccess = async (req, res, next) => {
    // Log is created by the controllers when actions occur
    // This middleware simply attaches helper for IP and session info
    req.qmgrMeta = {
        ipAddress: req.ip || req.connection.remoteAddress,
        sessionToken: req.adminSession ? req.adminSession.qmgrToken.substring(0, 8) + '...' : 'unknown',
        performedBy: req.adminUsername || 'admin'
    };
    next();
};

module.exports = logQmgrAccess;
