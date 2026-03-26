const mongoose = require('mongoose');
const Question = require('../models/Question');
const Round = require('../models/Round');
const Team = require('../models/Team');
const TeamAnswer = require('../models/TeamAnswer');
const QuestionAuditLog = require('../models/QuestionAuditLog');
const { TEAM_SAFE_FIELDS, CIPHER_TYPES } = require('../config/config');

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache'
};

const setNoCacheHeaders = (res) => {
    Object.entries(NO_CACHE_HEADERS).forEach(([k, v]) => res.set(k, v));
};

// GET /api/{QM_PREFIX}/questions
exports.getQuestions = async (req, res) => {
    setNoCacheHeaders(res);
    const { roundNumber, cipherType, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (roundNumber) filter.roundNumber = parseInt(roundNumber);
    if (cipherType) filter.cipherType = cipherType;

    const questions = await Question.find(filter)
        .select('+correctAnswer +hintLetter')
        .sort({ roundNumber: 1, displayOrder: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await Question.countDocuments(filter);

    res.json({ questions, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
};

// POST /api/{QM_PREFIX}/questions
exports.createQuestion = async (req, res) => {
    setNoCacheHeaders(res);
    const { cipherType, correctAnswer, points, displayOrder, roundNumber, imageUrl, codeSnippet, ...rest } = req.body;

    // Validation
    if (!CIPHER_TYPES.includes(cipherType)) {
        return res.status(400).json({ error: 'INVALID_CIPHER_TYPE' });
    }
    if (!correctAnswer || correctAnswer.length > 500) {
        return res.status(400).json({ error: 'INVALID_CORRECT_ANSWER' });
    }
    if (points && (points < 1 || points > 100)) {
        return res.status(400).json({ error: 'INVALID_POINTS' });
    }
    if (['TTT', 'GC'].includes(cipherType) && !imageUrl) {
        return res.status(400).json({ error: 'IMAGE_REQUIRED_FOR_TYPE' });
    }
    if (cipherType === 'CODE' && !codeSnippet) {
        return res.status(400).json({ error: 'CODE_SNIPPET_REQUIRED' });
    }

    const round = await Round.findOne({ roundNumber });
    if (!round) return res.status(404).json({ error: 'ROUND_NOT_FOUND' });

    const question = await Question.create({
        ...rest,
        cipherType,
        correctAnswer,
        points: points || 10,
        displayOrder,
        roundNumber,
        roundId: round._id,
        imageUrl,
        codeSnippet
    });

    await QuestionAuditLog.create({
        questionId: question._id,
        roundNumber,
        action: 'CREATED',
        performedBy: req.qmgrMeta.performedBy,
        newState: question.toObject(),
        ipAddress: req.qmgrMeta.ipAddress,
        sessionToken: req.qmgrMeta.sessionToken
    });

    const io = req.app.get('io');
    if (io) io.to('admin').emit('qmgr:question_added', { questionId: question._id, roundNumber });

    // Return full question including answers (admin context)
    const fullQuestion = await Question.findById(question._id).select('+correctAnswer +hintLetter');
    res.status(201).json({ question: fullQuestion });
};

// PUT /api/{QM_PREFIX}/questions/:id
exports.updateQuestion = async (req, res) => {
    setNoCacheHeaders(res);
    const currentQuestion = await Question.findById(req.params.id).select('+correctAnswer +hintLetter');
    if (!currentQuestion) return res.status(404).json({ error: 'QUESTION_NOT_FOUND' });

    const previousState = currentQuestion.toObject();

    // Detect changed fields
    const changedFields = Object.keys(req.body).filter(key => {
        return JSON.stringify(currentQuestion[key]) !== JSON.stringify(req.body[key]);
    });

    // Count affected teams
    const affectedTeams = await Team.countDocuments({
        currentRound: currentQuestion.roundNumber,
        currentQuestionIndex: currentQuestion.displayOrder - 1,
        approvalStatus: 'APPROVED',
        lockoutStatus: { $ne: 'LOCKED' }
    });

    Object.assign(currentQuestion, req.body);
    await currentQuestion.save();

    await QuestionAuditLog.create({
        questionId: currentQuestion._id,
        roundNumber: currentQuestion.roundNumber,
        action: 'UPDATED',
        performedBy: req.qmgrMeta.performedBy,
        previousState,
        newState: currentQuestion.toObject(),
        changedFields,
        affectedTeams,
        ipAddress: req.qmgrMeta.ipAddress,
        sessionToken: req.qmgrMeta.sessionToken
    });

    const io = req.app.get('io');
    if (io) io.to('admin').emit('qmgr:question_updated', { questionId: currentQuestion._id, affectedTeams });

    const fullQuestion = await Question.findById(currentQuestion._id).select('+correctAnswer +hintLetter');
    res.json({ question: fullQuestion, affectedTeams });
};

// DELETE /api/{QM_PREFIX}/questions/:id
exports.deleteQuestion = async (req, res) => {
    setNoCacheHeaders(res);
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'QUESTION_NOT_FOUND' });

    // Block if teams are currently on this question
    const teamsOnQuestion = await Team.countDocuments({
        currentRound: question.roundNumber,
        currentQuestionIndex: question.displayOrder - 1,
        approvalStatus: 'APPROVED',
        isFinished: false
    });

    if (teamsOnQuestion > 0) {
        return res.status(409).json({
            error: 'CONFLICT',
            message: `${teamsOnQuestion} team(s) currently on this question. Use Live Swap instead.`
        });
    }

    // Check if answered
    const answered = await TeamAnswer.countDocuments({ questionId: question._id });

    if (answered > 0) {
        question.isDeleted = true;
        await question.save();
    } else {
        await Question.findByIdAndDelete(question._id);
    }

    // Re-number display order
    const remaining = await Question.find({
        roundNumber: question.roundNumber,
        isDeleted: { $ne: true }
    }).sort({ displayOrder: 1 });

    const bulkOps = remaining.map((q, i) => ({
        updateOne: { filter: { _id: q._id }, update: { displayOrder: i + 1 } }
    }));
    if (bulkOps.length > 0) await Question.bulkWrite(bulkOps);

    await QuestionAuditLog.create({
        questionId: question._id,
        roundNumber: question.roundNumber,
        action: 'DELETED',
        performedBy: req.qmgrMeta.performedBy,
        previousState: question.toObject(),
        ipAddress: req.qmgrMeta.ipAddress,
        sessionToken: req.qmgrMeta.sessionToken
    });

    const io = req.app.get('io');
    if (io) io.to('admin').emit('qmgr:question_deleted', { questionId: question._id });

    res.json({ message: 'QUESTION_DELETED', softDeleted: answered > 0 });
};

// POST /api/{QM_PREFIX}/questions/reorder
exports.reorderQuestions = async (req, res) => {
    setNoCacheHeaders(res);
    const { roundNumber, orderedIds } = req.body;

    if (!roundNumber || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'INVALID_REQUEST' });
    }

    // Validate all IDs belong to specified round
    const questions = await Question.find({
        _id: { $in: orderedIds },
        roundNumber,
        isDeleted: { $ne: true }
    });

    if (questions.length !== orderedIds.length) {
        return res.status(400).json({ error: 'INVALID_IDS', message: 'Some IDs do not belong to this round' });
    }

    const bulkOps = orderedIds.map((id, i) => ({
        updateOne: { filter: { _id: id }, update: { displayOrder: i + 1 } }
    }));

    await Question.bulkWrite(bulkOps);

    await QuestionAuditLog.create({
        roundNumber,
        action: 'REORDERED',
        performedBy: req.qmgrMeta.performedBy,
        newState: { orderedIds },
        ipAddress: req.qmgrMeta.ipAddress,
        sessionToken: req.qmgrMeta.sessionToken
    });

    res.json({ message: 'QUESTIONS_REORDERED' });
};

// POST /api/{QM_PREFIX}/live-swap
exports.liveSwap = async (req, res) => {
    setNoCacheHeaders(res);
    const { questionId, newContent, notifyTeams } = req.body;

    if (!questionId || !newContent) {
        return res.status(400).json({ error: 'INVALID_REQUEST' });
    }

    const question = await Question.findById(questionId).select('+correctAnswer +hintLetter');
    if (!question) return res.status(404).json({ error: 'QUESTION_NOT_FOUND' });

    const previousState = question.toObject();

    // Count affected teams
    const affectedTeams = await Team.countDocuments({
        currentRound: question.roundNumber,
        currentQuestionIndex: question.displayOrder - 1,
        approvalStatus: 'APPROVED',
        lockoutStatus: { $ne: 'LOCKED' }
    });

    // Update question
    Object.assign(question, newContent);
    await question.save();

    // Clear wrong-attempt records
    const clearedResult = await TeamAnswer.deleteMany({
        questionId,
        isCorrect: false
    });

    await QuestionAuditLog.create({
        questionId,
        roundNumber: question.roundNumber,
        action: 'LIVE_SWAPPED',
        performedBy: req.qmgrMeta.performedBy,
        previousState,
        newState: question.toObject(),
        changedFields: Object.keys(newContent),
        affectedTeams,
        liveSwap: true,
        ipAddress: req.qmgrMeta.ipAddress,
        sessionToken: req.qmgrMeta.sessionToken
    });

    const io = req.app.get('io');
    if (io) {
        if (notifyTeams) {
            // Find all affected team IDs
            const teams = await Team.find({
                currentRound: question.roundNumber,
                currentQuestionIndex: question.displayOrder - 1,
                approvalStatus: 'APPROVED',
                lockoutStatus: { $ne: 'LOCKED' }
            }).select('_id');

            teams.forEach(t => {
                io.to(`team:${t._id}`).emit('question:live_updated', {
                    message: '[ QUESTION UPDATED — REFRESHED ]'
                });
            });
        }

        io.to('admin').emit('qmgr:question_updated', { questionId, affectedTeams, liveSwap: true });
    }

    res.json({
        updated: true,
        affectedTeams,
        clearedAttempts: clearedResult.deletedCount
    });
};

// POST /api/{QM_PREFIX}/questions/bulk
exports.bulkImport = async (req, res) => {
    setNoCacheHeaders(res);
    const { rounds: roundsData } = req.body;

    if (!roundsData || !Array.isArray(roundsData)) {
        return res.status(400).json({ error: 'INVALID_JSON_FORMAT' });
    }

    // Validate ENTIRE payload before writing
    const errors = [];
    const validQuestions = [];

    for (const roundData of roundsData) {
        if (!roundData.roundNumber) {
            errors.push({ error: 'MISSING_ROUND_NUMBER' });
            continue;
        }

        const seen = new Set();
        if (roundData.questions) {
            for (const q of roundData.questions) {
                if (!q.questionNumber) {
                    errors.push({ round: roundData.roundNumber, error: 'MISSING_QUESTION_NUMBER' });
                }
                if (seen.has(q.questionNumber)) {
                    errors.push({ round: roundData.roundNumber, question: q.questionNumber, error: 'DUPLICATE_QUESTION_NUMBER' });
                }
                seen.add(q.questionNumber);

                if (!CIPHER_TYPES.includes(q.cipherType)) {
                    errors.push({ round: roundData.roundNumber, question: q.questionNumber, error: `INVALID_CIPHER_TYPE: ${q.cipherType}` });
                }
                if (!q.correctAnswer) {
                    errors.push({ round: roundData.roundNumber, question: q.questionNumber, error: 'MISSING_CORRECT_ANSWER' });
                }
                if (['TTT', 'GC'].includes(q.cipherType) && !q.imageUrl) {
                    errors.push({ round: roundData.roundNumber, question: q.questionNumber, error: 'IMAGE_REQUIRED_FOR_TYPE' });
                }
                if (q.cipherType === 'CODE' && !q.codeSnippet) {
                    errors.push({ round: roundData.roundNumber, question: q.questionNumber, error: 'CODE_SNIPPET_REQUIRED' });
                }
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: 'VALIDATION_FAILED', errors });
    }

    // Use MongoDB transaction for atomic insert
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let roundCount = 0;
        let questionCount = 0;

        for (const roundData of roundsData) {
            let round = await Round.findOne({ roundNumber: roundData.roundNumber }).session(session);
            if (!round) {
                round = await Round.create([{
                    roundNumber: roundData.roundNumber,
                    roundName: roundData.roundName || `LEVEL ${String(roundData.roundNumber).padStart(2, '0')}`,
                    isActive: false
                }], { session });
                round = round[0];
                roundCount++;
            }

            if (roundData.questions) {
                const questions = roundData.questions.map(q => ({
                    roundId: round._id,
                    roundNumber: roundData.roundNumber,
                    questionNumber: q.questionNumber,
                    displayOrder: q.displayOrder || q.questionNumber,
                    cipherType: q.cipherType,
                    cipherLabel: q.cipherLabel,
                    encryptedText: q.encryptedText,
                    codeSnippet: q.codeSnippet,
                    imageUrl: q.imageUrl,
                    hintLetter: q.hintLetter,
                    hint: q.hint,
                    correctAnswer: q.correctAnswer,
                    points: q.points || 10
                }));

                await Question.insertMany(questions, { session });
                questionCount += questions.length;
            }
        }

        await session.commitTransaction();

        await QuestionAuditLog.create({
            action: 'BULK_IMPORTED',
            performedBy: req.qmgrMeta.performedBy,
            newState: { rounds: roundsData.length, questions: questionCount },
            ipAddress: req.qmgrMeta.ipAddress,
            sessionToken: req.qmgrMeta.sessionToken
        });

        res.json({ imported: { rounds: roundCount, questions: questionCount }, errors: [] });
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

// GET /api/{QM_PREFIX}/rounds
exports.getRounds = async (req, res) => {
    setNoCacheHeaders(res);
    const rounds = await Round.find({}).sort({ roundNumber: 1 });

    const roundsWithCounts = await Promise.all(rounds.map(async (round) => {
        const questionCount = await Question.countDocuments({
            roundNumber: round.roundNumber,
            isDeleted: { $ne: true }
        });
        return { ...round.toObject(), questionCount };
    }));

    res.json({ rounds: roundsWithCounts });
};

// POST /api/{QM_PREFIX}/rounds
exports.createRound = async (req, res) => {
    setNoCacheHeaders(res);
    const { roundNumber, roundName, timeLimitSeconds } = req.body;
    const round = await Round.create({ roundNumber, roundName, timeLimitSeconds: timeLimitSeconds || 3600 });
    res.status(201).json({ round });
};

// PUT /api/{QM_PREFIX}/rounds/:id
exports.updateRound = async (req, res) => {
    setNoCacheHeaders(res);
    const round = await Round.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!round) return res.status(404).json({ error: 'ROUND_NOT_FOUND' });
    res.json({ round });
};

// GET /api/{QM_PREFIX}/preview/:id
exports.previewQuestion = async (req, res) => {
    setNoCacheHeaders(res);
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'QUESTION_NOT_FOUND' });

    const safeFields = {};
    for (const key of Object.keys(TEAM_SAFE_FIELDS)) {
        if (question[key] !== undefined) safeFields[key] = question[key];
    }

    const fullQ = await Question.findById(req.params.id).select('+correctAnswer +hintLetter');

    res.json({
        ...safeFields,
        hasCorrectAnswer: !!fullQ.correctAnswer,
        hasImage: !!question.imageUrl,
        hintSet: !!fullQ.hintLetter
    });
};

// GET /api/{QM_PREFIX}/audit-log
exports.getAuditLog = async (req, res) => {
    setNoCacheHeaders(res);
    const { questionId, action, from, to, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (questionId) filter.questionId = questionId;
    if (action) filter.action = action;
    if (from || to) {
        filter.performedAt = {};
        if (from) filter.performedAt.$gte = new Date(from);
        if (to) filter.performedAt.$lte = new Date(to);
    }

    const logs = await QuestionAuditLog.find(filter)
        .sort({ performedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await QuestionAuditLog.countDocuments(filter);

    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
};
