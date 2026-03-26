require('dotenv').config();
const mongoose = require('mongoose');

const Team = require('./models/Team');
const TeamAnswer = require('./models/TeamAnswer');
const ViolationLog = require('./models/ViolationLog');
const AdminSession = require('./models/AdminSession');
const QuestionAuditLog = require('./models/QuestionAuditLog');

const clearData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for clearing data...');
        
        const deletedTeams = await Team.deleteMany({});
        console.log(`✓ Deleted ${deletedTeams.deletedCount} teams.`);

        const deletedAnswers = await TeamAnswer.deleteMany({});
        console.log(`✓ Deleted ${deletedAnswers.deletedCount} team answers.`);

        const deletedViols = await ViolationLog.deleteMany({});
        console.log(`✓ Deleted ${deletedViols.deletedCount} violation logs.`);

        const deletedAdminSessions = await AdminSession.deleteMany({});
        console.log(`✓ Deleted ${deletedAdminSessions.deletedCount} admin sessions.`);

        const deletedAuditLogs = await QuestionAuditLog.deleteMany({});
        console.log(`✓ Deleted ${deletedAuditLogs.deletedCount} audit logs.`);

        console.log('\n✓ All event registered data cleared successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing data:', err);
        process.exit(1);
    }
};

clearData();
