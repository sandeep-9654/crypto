const Team = require('../models/Team');

const lockoutMiddleware = async (req, res, next) => {
    try {
        const team = await Team.findById(req.teamId);
        if (!team) {
            return res.status(404).json({ error: 'TEAM_NOT_FOUND' });
        }

        if (team.approvalStatus !== 'APPROVED') {
            return res.status(403).json({
                error: 'TEAM_NOT_APPROVED',
                approvalStatus: team.approvalStatus,
                rejectionReason: team.rejectionReason
            });
        }

        if (team.lockoutStatus === 'LOCKED') {
            return res.status(423).json({
                error: 'TEAM_LOCKED',
                lockReason: team.lockReason,
                lockedAt: team.lockedAt
            });
        }

        req.team = team;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = lockoutMiddleware;
