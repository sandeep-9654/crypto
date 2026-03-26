const jwt = require('jsonwebtoken');
const Team = require('../models/Team');
const ViolationLog = require('../models/ViolationLog');
const { GRACE_PERIOD_SECONDS } = require('../config/config');
const logger = require('../utils/logger');

// In-memory map for grace period timers
const pendingLockouts = new Map();

const triggerGracePeriod = (teamId, teamName, reason, io) => {
    // Clear existing timer if any
    if (pendingLockouts.has(teamId.toString())) {
        clearTimeout(pendingLockouts.get(teamId.toString()));
    }

    const timer = setTimeout(async () => {
        try {
            const team = await Team.findById(teamId);
            if (team && team.lockoutStatus === 'ACTIVE') {
                await Team.findByIdAndUpdate(teamId, {
                    lockoutStatus: 'LOCKED',
                    lockedAt: new Date(),
                    lockReason: reason
                });

                await ViolationLog.create({
                    teamId,
                    teamName,
                    violationType: 'LOCKOUT_TRIGGERED',
                    details: `Auto-locked after grace period. Reason: ${reason}`
                });

                io.to(`team:${teamId}`).emit('lockout:activated', { reason });
                io.to('admin').emit('team:locked', { teamId, teamName, reason });
            }
        } catch (err) {
            logger.error('Grace period lockout error:', err);
        }
        pendingLockouts.delete(teamId.toString());
    }, GRACE_PERIOD_SECONDS * 1000);

    pendingLockouts.set(teamId.toString(), timer);
};

const clearTeamLockout = async (teamId, teamName, io) => {
    try {
        if (pendingLockouts.has(teamId.toString())) {
            clearTimeout(pendingLockouts.get(teamId.toString()));
            pendingLockouts.delete(teamId.toString());
        }

        const team = await Team.findByIdAndUpdate(teamId, {
            connectivityLostAt: null,
            graceExpiresAt: null
        }, { new: true });

        io.to('admin').emit('team:connectivity_restored', {
            teamId,
            teamName: team ? team.teamName : teamName
        });
    } catch (err) {
        logger.error('Error clearing lockout flag:', err);
    }
};

module.exports = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token ||
            (socket.handshake.headers.cookie && (() => {
                const match = socket.handshake.headers.cookie.match(/auth_token=([^;]+)/);
                return match ? match[1] : null;
            })());

        if (!token) {
            return next(new Error('AUTHENTICATION_REQUIRED'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            return next(new Error('INVALID_TOKEN'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.user;

        // Join appropriate rooms
        if (user.role === 'admin') {
            socket.join('admin');
            logger.info(`Admin connected: ${user.username}`);
        } else if (user.role === 'team') {
            socket.join(`team:${user.teamId}`);
            logger.info(`Team connected: ${user.teamName}`);
            // Clear any pending lockout since team has reconnected
            clearTeamLockout(user.teamId, user.teamName, io);
        }

        // Tab switch violation
        socket.on('client:tab_switch', async ({ teamId, violationCount }) => {
            try {
                const team = await Team.findByIdAndUpdate(teamId, {
                    $inc: { tabViolations: 1 }
                }, { new: true });

                await ViolationLog.create({
                    teamId,
                    teamName: team.teamName,
                    violationType: 'TAB_SWITCH',
                    details: `Violation ${violationCount}`
                });

                io.to('admin').emit('team:violation', {
                    teamId,
                    teamName: team.teamName,
                    type: 'TAB_SWITCH',
                    violationCount
                });
            } catch (err) {
                logger.error('Tab switch handler error:', err);
            }
        });

        // Lockout trigger from client
        socket.on('client:lockout_trigger', async ({ teamId, reason }) => {
            try {
                const team = await Team.findByIdAndUpdate(teamId, {
                    lockoutStatus: 'LOCKED',
                    lockedAt: new Date(),
                    lockReason: reason,
                    $inc: { lockViolationCount: 1 }
                }, { new: true });

                await ViolationLog.create({
                    teamId,
                    teamName: team.teamName,
                    violationType: 'LOCKOUT_TRIGGERED',
                    details: `Locked due to: ${reason}`
                });

                io.to(`team:${teamId}`).emit('lockout:activated', { reason });
                io.to('admin').emit('team:locked', {
                    teamId,
                    teamName: team.teamName,
                    reason
                });
            } catch (err) {
                logger.error('Lockout trigger error:', err);
            }
        });

        // Connectivity lost
        socket.on('client:connectivity_lost', async ({ teamId }) => {
            try {
                const graceExpiry = new Date(Date.now() + GRACE_PERIOD_SECONDS * 1000);
                const team = await Team.findByIdAndUpdate(teamId, {
                    connectivityLostAt: new Date(),
                    graceExpiresAt: graceExpiry
                }, { new: true });

                io.to('admin').emit('team:connectivity_lost', {
                    teamId,
                    teamName: team.teamName,
                    graceExpiry
                });

                triggerGracePeriod(teamId, team.teamName, 'CONNECTIVITY_LOSS', io);
            } catch (err) {
                logger.error('Connectivity lost handler error:', err);
            }
        });

        // Connectivity restored
        socket.on('client:connectivity_restored', async ({ teamId }) => {
            await clearTeamLockout(teamId, user.teamName, io);
        });

        // Handle socket disconnect (potential power loss)
        socket.on('disconnect', async () => {
            if (user.role === 'team' && user.teamId) {
                try {
                    const team = await Team.findById(user.teamId);
                    if (team && !team.isFinished &&
                        team.lockoutStatus === 'ACTIVE' &&
                        team.approvalStatus === 'APPROVED') {

                        const graceExpiry = new Date(Date.now() + GRACE_PERIOD_SECONDS * 1000);
                        await Team.findByIdAndUpdate(user.teamId, {
                            connectivityLostAt: new Date(),
                            graceExpiresAt: graceExpiry
                        });

                        io.to('admin').emit('team:connectivity_lost', {
                            teamId: user.teamId,
                            teamName: team.teamName,
                            graceExpiry,
                            reason: 'POWER_LOSS'
                        });

                        triggerGracePeriod(user.teamId, team.teamName, 'POWER_LOSS', io);
                    }
                } catch (err) {
                    logger.error('Disconnect handler error:', err);
                }
            }
            logger.info(`Socket disconnected: ${user.teamName || user.username}`);
        });
    });
};
