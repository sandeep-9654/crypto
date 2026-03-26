const Team = require('../models/Team');

// GET /api/leaderboard
exports.getLeaderboard = async (req, res) => {
    const teams = await Team.find({
        approvalStatus: 'APPROVED',
        isActive: true
    })
        .select('teamName totalScore timeTakenSeconds currentRound currentQuestionIndex isFinished')
        .sort({ totalScore: -1, timeTakenSeconds: 1 })
        .limit(50);

    res.json({
        leaderboard: teams.map((team, index) => ({
            rank: index + 1,
            teamName: team.teamName,
            totalScore: team.totalScore,
            currentRound: team.currentRound,
            isFinished: team.isFinished,
            timeTakenSeconds: team.timeTakenSeconds
        }))
    });
};
