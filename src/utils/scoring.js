// Scoring utilities for the brain health questionnaire.
// Converts raw Q1-Q4 responses (1-5 scale) into domain scores (0-100) and an overall score.

// Each domain maps to a question and whether a higher answer is worse (reverse scoring).
// Screen exposure is reverse-scored because more screen time = weaker habit.
const DOMAIN_CONFIG = {
  sleep_rhythm:    { questionId: 'Q1', label: 'Sleep Rhythm',    reverse: false },
  move_mode:       { questionId: 'Q2', label: 'Move Mode',       reverse: false },
  screen_exposure: { questionId: 'Q3', label: 'Screen Exposure', reverse: true  },
  social_energy:   { questionId: 'Q4', label: 'Social Energy',   reverse: false },
}

// Maps internal domain keys to the legacy keys used by the Dashboard component.
// screen_exposure is displayed as cognitive_strain in the UI.
const LEGACY_DOMAIN_KEYS = {
  sleep_rhythm:    'sleep_rhythm',
  move_mode:       'move_mode',
  screen_exposure: 'cognitive_strain',
  social_energy:   'social_energy',
}

// Flips a 1-5 score so that 1 becomes 5 and 5 becomes 1.
// Used for screen_exposure where a lower raw answer means a better habit.
function reverseScore(value) {
  return 6 - value
}

// Converts a 1-5 answer into a 0-100 domain score (each point = 20).
function calculateDomainScore(value, reverse = false) {
  const adjusted = reverse ? reverseScore(value) : value
  return adjusted * 20
}

// Validates that a response value is a finite number between 1 and 5.
// Returns null if the value is missing or out of range.
function normalizeScore(value) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  if (numberValue < 1 || numberValue > 5) return null
  return numberValue
}

// Returns a text label describing the overall score tier.
export function interpretScore(score) {
  if (score >= 75) return 'strong current habits'
  if (score >= 50) return 'moderate, room to improve'
  if (score >= 25) return 'noticeable strain or weaker habits'
  return 'priority area for support'
}

// Main scoring function. Takes raw questionnaire responses and returns a full snapshot object.
// Returns null if any required response is missing or invalid.
export function calculateSnapshotFromResponses(responses) {
  if (!responses) return null

  // Validate and coerce each response to a number in the 1-5 range
  const normalizedResponses = {
    Q1: normalizeScore(responses.Q1),
    Q2: normalizeScore(responses.Q2),
    Q3: normalizeScore(responses.Q3),
    Q4: normalizeScore(responses.Q4),
  }

  // If any question is unanswered or invalid, abort scoring
  if (Object.values(normalizedResponses).some((value) => value == null)) {
    return null
  }

  // Calculate a 0-100 score for each domain using the current domain keys
  const domainScoresLatest = Object.entries(DOMAIN_CONFIG).map(([key, config]) => ({
    key,
    label: config.label,
    score: calculateDomainScore(normalizedResponses[config.questionId], config.reverse),
  }))

  // Build adjusted raw values (post-reverse) to calculate the overall average
  const adjustedScores = Object.values(DOMAIN_CONFIG).map((config) =>
    config.reverse
      ? reverseScore(normalizedResponses[config.questionId])
      : normalizedResponses[config.questionId],
  )

  // Overall score = average of adjusted values scaled to 0-100
  const overallScore = Math.round(
    (adjustedScores.reduce((sum, value) => sum + value, 0) / adjustedScores.length) * 20,
  )

  // Remap domain keys to legacy names so the Dashboard component can find them
  const domainScoresLegacy = domainScoresLatest.map((domain) => ({
    ...domain,
    key: LEGACY_DOMAIN_KEYS[domain.key],
  }))

  return {
    normalizedResponses,
    domainScoresLatest,
    domainScoresLegacy,
    overallScore,
    overallInterpretation: interpretScore(overallScore),
  }
}
