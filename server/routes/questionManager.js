const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const verifyQmgrToken = require('../middleware/verifyQmgrToken');
const logQmgrAccess = require('../middleware/logQmgrAccess');
const qmgrRateLimiter = require('../middleware/qmgrRateLimiter');
const qmController = require('../controllers/questionManagerController');
const { upload } = require('../utils/cloudinary');

// ALL QM routes require both admin JWT + QMGR token
router.use(adminMiddleware, verifyQmgrToken, logQmgrAccess);

// Questions CRUD
router.get('/questions', qmController.getQuestions);
router.post('/questions', qmgrRateLimiter, qmController.createQuestion);
router.put('/questions/:id', qmgrRateLimiter, qmController.updateQuestion);
router.delete('/questions/:id', qmgrRateLimiter, qmController.deleteQuestion);

// Reorder + Bulk
router.post('/questions/reorder', qmgrRateLimiter, qmController.reorderQuestions);
router.post('/questions/bulk', qmgrRateLimiter, qmController.bulkImport);

// Rounds
router.get('/rounds', qmController.getRounds);
router.post('/rounds', qmgrRateLimiter, qmController.createRound);
router.put('/rounds/:id', qmgrRateLimiter, qmController.updateRound);

// Preview + Live Swap
router.get('/preview/:id', qmController.previewQuestion);
router.post('/live-swap', qmgrRateLimiter, qmController.liveSwap);

// Audit Log
router.get('/audit-log', qmController.getAuditLog);

// Image upload endpoint for QM
router.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'NO_FILE_UPLOADED' });
    res.json({ imageUrl: req.file.path });
});

module.exports = router;
