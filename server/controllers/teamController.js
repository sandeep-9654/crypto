const Team = require('../models/Team');
const Question = require('../models/Question');
const TeamAnswer = require('../models/TeamAnswer');
const Round = require('../models/Round');
const { TEAM_SAFE_FIELDS, INPUT_LIMITS } = require('../config/config');

// GET /api/team/dashboard
exports.getDashboard = async (req, res) => {
    let team = await Team.findById(req.teamId);
    if (!team) return res.status(404).json({ error: 'TEAM_NOT_FOUND' });

    // Auto-advance: if team completed all questions in their current round but
    // currentRound was never incremented (legacy bug fix), advance them now
    if (!team.isFinished) {
        const questionsInCurrentRound = await Question.countDocuments({
            roundNumber: team.currentRound,
            isDeleted: { $ne: true }
        });

        if (questionsInCurrentRound > 0 && team.currentQuestionIndex >= questionsInCurrentRound) {
            const totalRounds = await Round.countDocuments({});
            if (team.currentRound < totalRounds) {
                // Advance to next round
                team = await Team.findByIdAndUpdate(req.teamId, {
                    currentRound: team.currentRound + 1,
                    currentQuestionIndex: 0,
                    startTime: null
                }, { new: true });
            }
        }
    }

    // Get active round
    const round = await Round.findOne({ roundNumber: team.currentRound, isActive: true });
    if (!round) {
        return res.json({
            teamId: team._id,
            teamName: team.teamName,
            currentRound: team.currentRound,
            totalScore: team.totalScore,
            waiting: true,
            message: 'ROUND_NOT_ACTIVE'
        });
    }

    // Get total questions in this round
    const totalQuestions = await Question.countDocuments({
        roundNumber: team.currentRound,
        isDeleted: { $ne: true }
    });

    // If team finished all questions in this round
    if (team.currentQuestionIndex >= totalQuestions) {
        return res.json({
            teamId: team._id,
            teamName: team.teamName,
            currentRound: team.currentRound,
            totalScore: team.totalScore,
            roundComplete: true,
            isFinished: team.isFinished
        });
    }

    // Get current question using TEAM_SAFE_FIELDS only
    const question = await Question.findOne({
        roundNumber: team.currentRound,
        displayOrder: team.currentQuestionIndex + 1,
        isDeleted: { $ne: true }
    }).select(Object.keys(TEAM_SAFE_FIELDS).join(' '));

    if (!question) {
        return res.json({
            teamId: team._id,
            teamName: team.teamName,
            currentRound: team.currentRound,
            totalScore: team.totalScore,
            roundComplete: true
        });
    }

    // If team has not started yet and the round is active, start their timer NOW
    let currentStartTime = team.startTime;
    if (!currentStartTime) {
        currentStartTime = new Date();
        await Team.findByIdAndUpdate(req.teamId, { startTime: currentStartTime });
    }

    // Get attempt count for hint logic
    const wrongAttempts = await TeamAnswer.countDocuments({
        teamId: req.teamId,
        questionId: question._id,
        isCorrect: false
    });

    // Only include hintLetter if 3+ wrong attempts
    let hintLetter = null;
    if (wrongAttempts >= 3) {
        const qWithHint = await Question.findById(question._id).select('+hintLetter');
        hintLetter = qWithHint.hintLetter;
    }

    res.json({
        teamId: team._id,
        teamName: team.teamName,
        currentRound: team.currentRound,
        currentQuestionIndex: team.currentQuestionIndex,
        totalScore: team.totalScore,
        totalQuestions,
        timeLimitSeconds: round.timeLimitSeconds,
        startTime: currentStartTime,
        tabViolations: team.tabViolations,
        question: {
            _id: question._id,
            cipherType: question.cipherType,
            cipherLabel: question.cipherLabel,
            encryptedText: question.encryptedText,
            codeSnippet: question.codeSnippet,
            imageUrl: question.imageUrl,
            hint: question.hint,
            points: question.points,
            questionNumber: question.questionNumber,
            displayOrder: question.displayOrder,
            roundNumber: question.roundNumber,
            totalQuestions,
            wrongAttempts,
            ...(hintLetter && { hintLetter })
        }
    });
};

// POST /api/team/answer
exports.submitAnswer = async (req, res) => {
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
        return res.status(400).json({ error: 'MISSING_FIELDS' });
    }

    // Sanitize answer
    const sanitizedAnswer = String(answer)
        .substring(0, INPUT_LIMITS.ANSWER_MAX)
        .replace(/<[^>]*>/g, '')
        .trim();

    if (!sanitizedAnswer) {
        return res.status(400).json({ error: 'INVALID_ANSWER' });
    }

    const team = await Team.findById(req.teamId);
    if (!team) return res.status(404).json({ error: 'TEAM_NOT_FOUND' });

    // Prevent duplicate correct answers for the same question
    const alreadyCorrect = await TeamAnswer.findOne({ teamId: req.teamId, questionId, isCorrect: true });
    if (alreadyCorrect) {
        return res.json({ result: 'ALREADY_ANSWERED', message: 'Already decoded this question' });
    }

    // Set start time on first answer
    if (!team.startTime) {
        await Team.findByIdAndUpdate(req.teamId, { startTime: new Date() });
    }

    // Server-side validation with select('+correctAnswer')
    const question = await Question.findById(questionId).select('+correctAnswer');
    if (!question) return res.status(404).json({ error: 'QUESTION_NOT_FOUND' });

    // Get attempt count
    const previousAttempts = await TeamAnswer.countDocuments({
        teamId: req.teamId,
        questionId
    });

    const isCorrect = sanitizedAnswer.toUpperCase() === question.correctAnswer.trim().toUpperCase();

    // Save answer
    const teamAnswer = await TeamAnswer.create({
        teamId: req.teamId,
        questionId,
        roundNumber: question.roundNumber,
        submittedAnswer: sanitizedAnswer,
        isCorrect,
        pointsAwarded: isCorrect ? question.points : 0,
        attemptNumber: previousAttempts + 1
    });

    if (isCorrect) {
        // Update team progress
        const totalQuestions = await Question.countDocuments({
            roundNumber: team.currentRound,
            isDeleted: { $ne: true }
        });

        const newIndex = team.currentQuestionIndex + 1;
        const roundComplete = newIndex >= totalQuestions;

        // Check if all rounds are done
        const totalRounds = await Round.countDocuments({});
        const allDone = roundComplete && team.currentRound >= totalRounds;

        const updateObj = {
            $inc: { totalScore: question.points },
            currentQuestionIndex: roundComplete ? 0 : newIndex
        };

        // Advance to next round if current round is complete but not all done
        if (roundComplete && !allDone) {
            updateObj.currentRound = team.currentRound + 1;
            updateObj.startTime = null; // Reset timer for next round
        }

        if (allDone) {
            updateObj.isFinished = true;
            updateObj.endTime = new Date();
            const startTime = team.startTime || new Date();
            updateObj.timeTakenSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
        }

        await Team.findByIdAndUpdate(req.teamId, updateObj);

        // Emit leaderboard update
        const io = req.app.get('io');
        if (io) {
            const leaderboard = await Team.find({
                approvalStatus: 'APPROVED',
                isActive: true
            })
                .select('teamName totalScore timeTakenSeconds currentRound currentQuestionIndex isFinished')
                .sort({ totalScore: -1, timeTakenSeconds: 1 })
                .limit(50);

            io.emit('leaderboard:update', leaderboard);

            if (allDone) {
                const rank = leaderboard.findIndex(t => t._id.toString() === req.teamId.toString()) + 1;
                io.to('admin').emit('team:completed', {
                    teamId: req.teamId,
                    teamName: team.teamName,
                    score: team.totalScore + question.points,
                    rank
                });
            }
        }

        return res.json({
            result: 'CORRECT',
            message: '✓ DECRYPTED',
            pointsAwarded: question.points,
            roundComplete,
            isFinished: allDone
        });
    }

    // Wrong answer
    const wrongCount = previousAttempts + 1;
    let hintLetter = null;

    // Reveal hint after 3 wrong attempts
    if (wrongCount >= 3) {
        const qHint = await Question.findById(questionId).select('+hintLetter');
        hintLetter = qHint.hintLetter;
        if (hintLetter) {
            teamAnswer.hintRevealed = true;
            await teamAnswer.save();
        }
    }

    res.json({
        result: 'INCORRECT',
        message: '✗ ACCESS_DENIED',
        attemptNumber: wrongCount,
        ...(hintLetter && { hintLetter, hintMessage: `Hint: The answer contains the letter "${hintLetter}"` })
    });
};

// GET /api/team/progress
exports.getProgress = async (req, res) => {
    const team = await Team.findById(req.teamId);
    if (!team) return res.status(404).json({ error: 'TEAM_NOT_FOUND' });

    const answers = await TeamAnswer.find({ teamId: req.teamId, isCorrect: true })
        .select('questionId roundNumber pointsAwarded attemptedAt');

    res.json({
        teamName: team.teamName,
        totalScore: team.totalScore,
        currentRound: team.currentRound,
        currentQuestionIndex: team.currentQuestionIndex,
        isFinished: team.isFinished,
        answeredQuestions: answers
    });
};
