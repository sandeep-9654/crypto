const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

// All admin routes require admin JWT
router.use(adminMiddleware);

router.get('/dashboard', adminController.getDashboard);

// Approval management
router.get('/approvals', adminController.getApprovals);
router.put('/approvals/:id/approve', adminController.approveTeam);
router.put('/approvals/:id/reject', adminController.rejectTeam);
router.put('/approvals/:id/revoke', adminController.revokeTeam);
router.put('/approvals/approve-all', adminController.approveAll);

// Team management
router.get('/teams', adminController.getTeams);
router.put('/teams/:id/reinstate', adminController.reinstateTeam);
router.put('/teams/:id/lock', adminController.lockTeam);
router.put('/teams/:id/reset', adminController.resetTeam);

// Round management
router.post('/round/:n/toggle', adminController.toggleRound);

// Monitoring
router.get('/monitor', adminController.getMonitor);
router.get('/violations', adminController.getViolations);
router.get('/export', adminController.exportData);

module.exports = router;
