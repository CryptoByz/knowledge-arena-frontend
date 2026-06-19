export const DAILY_QUIZ_ABI = [
  {
    name: 'enterQuiz',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'submitAnswers',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'answerHashes', type: 'bytes32[]' },
      { name: 'proofs', type: 'bytes32[][]' },
    ],
    outputs: [],
  },
  {
    name: 'canPlay',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'isTodayReady',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getTodayScore',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: 'score', type: 'uint8' }, { name: 'submitted', type: 'bool' }],
  },
  {
    name: 'lastPlayedDay',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'entryFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'QuizEntered',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'dayIndex', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'QuizCompleted',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'dayIndex', type: 'uint256', indexed: false },
      { name: 'score', type: 'uint8', indexed: false },
      { name: 'boostedScore', type: 'uint256', indexed: false },
    ],
  },
] as const

export const PLAYER_PROFILE_ABI = [
  {
    name: 'getProfile',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'totalScore', type: 'uint256' },
      { name: 'weeklyScore', type: 'uint256' },
      { name: 'monthlyScore', type: 'uint256' },
      { name: 'seasonScore', type: 'uint256' },
      { name: 'streakDays', type: 'uint256' },
      { name: 'boostMultiplier', type: 'uint256' },
      { name: 'achievementFlags', type: 'uint32' },
    ],
  },
] as const

export const ACHIEVEMENT_ABI = [
  {
    name: 'getAllAchievements',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'flagIndex', type: 'uint8' },
          { name: 'badgeTokenId', type: 'uint256' },
          { name: 'criteriaType', type: 'uint8' },
          { name: 'criteriaValue', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getPlayerAchievements',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'unlocked', type: 'bool[]' },
      { name: 'minted_', type: 'bool[]' },
    ],
  },
  {
    name: 'mintAchievementBadge',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'achievementIndex', type: 'uint8' }],
    outputs: [],
  },
  {
    name: 'gamesPlayed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const
