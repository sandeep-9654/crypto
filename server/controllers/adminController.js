const Team = require('../models/Team');
const Round = require('../models/Round');
const Question = require('../models/Question');
const TeamAnswer = require('../models/TeamAnswer');
const ViolationLog = require('../models/ViolationLog');
const { exportCSV } = require('../utils/exportCSV');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
    const [totalTeams, pendingTeams, approvedTeams, lockedTeams, totalRounds, totalQuestions] = await Promise.all([
        Team.countDocuments({}),
        Team.countDocuments({ approvalStatus: 'PENDING' }),
        Team.countDocuments({ approvalStatus: 'APPROVED' }),
        Team.countDocuments({ lockoutStatus: 'LOCKED' }),
        Round.countDocuments({}),
        Question.countDocuments({ isDeleted: { $ne: true } })
    ]);

    const activeRound = await Round.findOne({ isActive: true });
    const finishedTeams = await Team.countDocuments({ isFinished: true });
    const rounds = await Round.find({}).select('roundNumber roundName isActive timeLimitSeconds').sort({ roundNumber: 1 });

    res.json({
        totalTeams, pendingTeams, approvedTeams, lockedTeams,
        totalRounds, totalQuestions, finishedTeams,
        activeRound: activeRound ? { roundNumber: activeRound.roundNumber, roundName: activeRound.roundName } : null,
        rounds
    });
};

// GET /api/admin/approvals
exports.getApprovals = async (req, res) => {
    const { status = 'ALL' } = req.query;
    const filter = status !== 'ALL' ? { approvalStatus: status } : {};
    const teams = await Team.find(filter)
        .select('teamName participants approvalStatus approvedAt approvedBy rejectionReason createdAt')
        .sort({ createdAt: -1 });
    res.json({ teams });
};

// PUT /api/admin/approvals/:id/approve
exports.approveTeam = async (req, res) => {
    const team = await Team.findByIdAndUpdate(req.params.id, {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: req.adminUsername
    }, { new: true });

    if (!team) return res.status(404).json({ error: 'TEAM_NOT_FOUND' });

    const io = req.app.get('io');
    if (io) {
        io.to(`team:${team._id}`).emit('approval:granted', { message: 'ACCESS GRANTED — PROCEED TO DASHBOARD' });
        io.to('admin').emit('team:approved', { teamId: team._id, teamName: team.teamName });
    }

    res.json({ message: 'TEAM_APPROVED', team: { teamName: team.teamName, approvalStatus: team.approvalStatus } });
};

// PUT /api/admin/approvals/:id/reject
exports.rejectTeam = async (req, res) => {
    const { reason } = req.body;
    const team = await Team.findByIdAndUpdate(req.params.id, {
        approvalStatus: 'REJECTED',
        rejectionReason: reason || 'No reason provided'
    }, { new: true });

    if (!team) return res.status(404).json({ error: 'TEAM_NOT_FOUND' });

    const io = req.app.get('io');
    if (io) {
        io.to(`team:${team._id}`).emit('approval:rejected', { reason: team.rejectionReason });
    }

    res.json({ message: 'TEAM_REJECTED', team: { teamName: team.teamName } });
};

// PUT /api/admin/approvals/:id/revoke
exports.revokeTeam = async (req, res) => {
    const team = await Team.findByIdAndUpdate(req.params.id, {
        approvalStatus: 'PENDING',
        approvedAt: null,
        approvedBy: null
    }, { new: true });

    if (!team) return res.status(404).json({ error: 'TEAM_NOT_FOUND' });

    const io = req.app.get('io');
    if (io) {
        io.to(`team:${team._id}`).emit('approval:revoked', { message: 'ACCESS REVOKED — PENDING RE-REVIEW' });
    }

    res.json({ message: 'TEAM_REVOKED', team: { teamName: team.teamName } });
};

// PUT /api/admin/approvals/approve-all
exports.approveAll = async (req, res) => {
    // Capture pending team IDs before the update for reliable notification
    const pendingTeams = await Team.find({ approvalStatus: 'PENDING' }).select('_id teamName');
    const pendingIds = pendingTeams.map(t => t._id);

    const result = await Team.updateMany(
        { _id: { $in: pendingIds } },
        { approvalStatus: 'APPROVED', approvedAt: new Date(), approvedBy: req.adminUsername }
    );

    const io = req.app.get('io');
    if (io) {
        pendingTeams.forEach(team => {
            io.to(`team:${team._id}`).emit('approval:granted', { message: 'ACCESS GRANTED — PROCEED TO DASHBOARD' });
        });
    }

    res.json({ message: 'ALL_TEAMS_APPROVED', count: result.modifiedCount });
};

// GET /api/admin/teams
exports.getTeams = async (req, res) => {
    const teams = await Team.find({})
        .select('-passwordHash')
        .sort({ createdAt: -1 });
    res.json({ teams });
};

// PUT /api/admin/teams/:id/reinstate
exports.reinstateTeam = async (req, res) => {
    const { note, compensationMinutes } = req.body;

    // Calculate new start time if compensation is given
    const updateQuery = {
        lockoutStatus: 'ACTIVE',
        reinstatedAt: new Date(),
        reinstatedBy: req.adminUsername,
        reinstateNote: note || ''
    };

    if (compensationMinutes && compensationMinutes > 0) {
        // Find existing team to get their start time
        const existingTeam = await Team.findById(req.params.id);
        if (existingTeam) {
            // If they haven't started yet, establish a start time NOW so the compensation applies
            const baseTime = existingTeam.startTime || new Date();

            // Push their start time BACKWARDS by X minutes (into the future)
            // This tricks the frontend timer into thinking they have X more minutes left
            const newStartTime = new Date(baseTime.getTime() + (compensationMinutes * 60000));
            updateQuery.startTime = newStartTime;
        }
    }

    const team = await Team.findByIdAndUpdate(req.params.id, updateQuery, { new: true });

    if (!team) return res.status(404).json({ error: 'TEAM_NOT_FOUND' });

    // Log the reinstatement
    await ViolationLog.create({
        teamId: team._id,
        teamName: team.teamName,
        violationType: 'ADMIN_REINSTATED',
        details: `Reinstated by ${req.adminUsername}. Note: ${note || 'none'}. Compensation: ${compensationMinutes || 0} min.`,
        resolvedAt: new Date(),
        resolvedBy: req.adminUsername
    });

    const io = req.app.get('io');
    if (io) {
        io.to(`team:${team._id}`).emit('lockout:reinstated', {
            message: 'ACCESS RESTORED BY ADMIN',
            compensationMinutes: compensationMinutes || 0
        });
        io.to('admin').emit('team:reinstated', { teamId: team._id, teamName: team.teamName });
    }

    res.json({ message: 'TEAM_REINSTATED', team: { teamName: team.teamName, lockoutStatus: team.lockoutStatus } });
};

// PUT /api/admin/teams/:id/lock
exports.lockTeam = async (req, res) => {
    const { reason } = req.body;

    const team = await Team.findByIdAndUpdate(req.params.id, {
        lockoutStatus: 'LOCKED',
        lockedAt: new Date(),
        lockReason: reason || 'ADMIN_MANUAL',
        $inc: { lockViolationCount: 1 }
    }, { new: true });

    if (!team) return res.status(404).json({ error: 'TEAM_NOT_FOUND' });

    const io = req.app.get('io');
    if (io) {
        io.to(`team:${team._id}`).emit('lockout:activated', { reason: team.lockReason });
        io.to('admin').emit('team:locked', { teamId: team._id, teamName: team.teamName, reason: team.lockReason });
    }

    res.json({ message: 'TEAM_LOCKED', team: { teamName: team.teamName } });
};

// PUT /api/admin/teams/:id/reset
exports.resetTeam = async (req, res) => {
    const team = await Team.findByIdAndUpdate(req.params.id, {
        currentRound: 1,
        currentQuestionIndex: 0,
        totalScore: 0,
        startTime: null,
        endTime: null,
        timeTakenSeconds: null,
        isFinished: false,
        lockoutStatus: 'ACTIVE',
        tabViolations: 0,
        lockViolationCount: 0
    }, { new: true });

    if (!team) return res.status(404).json({ error: 'TEAM_NOT_FOUND' });

    // Clear their answers
    await TeamAnswer.deleteMany({ teamId: team._id });

    res.json({ message: 'TEAM_RESET', team: { teamName: team.teamName } });
};

// POST /api/admin/round/:n/toggle
exports.toggleRound = async (req, res) => {
    const roundNumber = parseInt(req.params.n);
    const round = await Round.findOne({ roundNumber });
    if (!round) return res.status(404).json({ error: 'ROUND_NOT_FOUND' });

    const willActivate = !round.isActive;

    // Deactivate all other rounds when activating this one
    if (willActivate) {
        await Round.updateMany({ _id: { $ne: round._id } }, { isActive: false });
    }

    round.isActive = willActivate;
    await round.save();

    const io = req.app.get('io');
    if (io && round.isActive) {
        io.emit('round:activated', { roundNumber });
    }

    res.json({ message: 'ROUND_TOGGLED', round: { roundNumber, isActive: round.isActive } });
};

// GET /api/admin/monitor
exports.getMonitor = async (req, res) => {
    const teams = await Team.find({ approvalStatus: 'APPROVED' })
        .select('teamName currentRound currentQuestionIndex totalScore lockoutStatus tabViolations isFinished startTime')
        .sort({ totalScore: -1 });
    res.json({ teams });
};

// GET /api/admin/violations
exports.getViolations = async (req, res) => {
    const violations = await ViolationLog.find({})
        .sort({ occurredAt: -1 })
        .limit(200);
    res.json({ violations });
};

// GET /api/admin/export
exports.exportData = async (req, res) => {
    const teams = await Team.find({ approvalStatus: 'APPROVED' })
        .select('teamName participants totalScore currentRound isFinished timeTakenSeconds tabViolations lockViolationCount')
        .sort({ totalScore: -1, timeTakenSeconds: 1 });

    const data = teams.map((t, i) => ({
        rank: i + 1,
        teamName: t.teamName,
        members: t.participants.map(p => `${p.name} (${p.registerNumber})`).join('; '),
        totalScore: t.totalScore,
        currentRound: t.currentRound,
        isFinished: t.isFinished,
        timeTakenSeconds: t.timeTakenSeconds,
        tabViolations: t.tabViolations,
        lockViolations: t.lockViolationCount
    }));

    const csv = exportCSV(data, [
        'rank', 'teamName', 'members', 'totalScore', 'currentRound',
        'isFinished', 'timeTakenSeconds', 'tabViolations', 'lockViolations'
    ]);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=cryptohunt_results.csv');
    res.send(csv);
};
