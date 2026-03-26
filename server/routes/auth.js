const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'LOGIN_ATTEMPTS_EXCEEDED' }
});

// Team auth
router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/approval-status', authMiddleware, authController.approvalStatus);
router.post('/refresh-token', authMiddleware, authController.refreshToken);

// Admin auth
router.post('/admin/login', loginLimiter, authController.adminLogin);
router.post('/admin/logout', authController.adminLogout);
router.post('/admin/logout-qmgr', adminMiddleware, authController.logoutQmgr);

module.exports = router;
