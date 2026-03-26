const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/authMiddleware');
const lockoutMiddleware = require('../middleware/lockoutMiddleware');
const teamController = require('../controllers/teamController');

const answerLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.teamId || req.ip,
    message: { error: 'ANSWER_RATE_LIMIT_EXCEEDED' }
});

// All team routes require auth + approval + active lockout status
router.use(authMiddleware, lockoutMiddleware);

router.get('/dashboard', teamController.getDashboard);
router.post('/answer', answerLimiter, teamController.submitAnswer);
router.get('/progress', teamController.getProgress);

module.exports = router;
