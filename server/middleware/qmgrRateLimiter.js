const rateLimit = require('express-rate-limit');

const qmgrRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'QM_RATE_LIMIT' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = qmgrRateLimiter;
