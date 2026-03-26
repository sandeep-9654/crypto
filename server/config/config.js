module.exports = {
  GRACE_PERIOD_SECONDS: 120,

  CIPHER_TYPES: ['CCS', 'TTT', 'AC', 'GC', 'PCS', 'MORSE', 'CODE'],

  LOCK_REASONS: ['TAB_SWITCH', 'CONNECTIVITY_LOSS', 'POWER_LOSS', 'ADMIN_MANUAL'],

  APPROVAL_STATUSES: ['PENDING', 'APPROVED', 'REJECTED'],

  LOCKOUT_STATUSES: ['ACTIVE', 'LOCKED', 'REINSTATED'],

  VIOLATION_TYPES: [
    'TAB_SWITCH', 'WINDOW_BLUR', 'CONNECTIVITY_LOSS',
    'POWER_LOSS', 'LOCKOUT_TRIGGERED', 'ADMIN_REINSTATED'
  ],

  AUDIT_ACTIONS: [
    'CREATED', 'UPDATED', 'DELETED', 'REORDERED',
    'LIVE_SWAPPED', 'BULK_IMPORTED', 'ROUND_TOGGLED'
  ],

  TEAM_SAFE_FIELDS: {
    _id: 1,
    cipherType: 1,
    cipherLabel: 1,
    encryptedText: 1,
    codeSnippet: 1,
    imageUrl: 1,
    hint: 1,
    points: 1,
    questionNumber: 1,
    displayOrder: 1,
    roundNumber: 1
  },

  MAX_TAB_VIOLATIONS: 3,

  QMGR_SESSION_DURATION_MS: 2 * 60 * 60 * 1000, // 2 hours

  QMGR_IDLE_TIMEOUT_MS: 15 * 60 * 1000, // 15 minutes

  INPUT_LIMITS: {
    TEAM_NAME_MAX: 30,
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 64,
    ANSWER_MAX: 500,
    REGISTER_NUMBER_MAX: 15
  }
};
