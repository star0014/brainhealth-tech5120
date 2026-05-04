// ─────────────────────────────────────────────────────────────────────────────
// Scoring utilities for the BrainBoost brain-health questionnaire.
//
// The app measures four domains. Each domain maps to one questionnaire question
// (Q1–Q4) answered on a 1-5 scale. Domain scores are converted to 0-100.
//
// Two scoring paths exist:
//   1. calculateSnapshotFromResponses — scores the initial 4-question onboarding quiz.
//   2. calculateSnapshotFromCheckin   — scores a daily habit check-in (HabitTracker).
// ─────────────────────────────────────────────────────────────────────────────

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
// If reverse=true, the value is flipped before scaling so that the
// worst habit (e.g. maximum screen time) still maps to a low score.
function calculateDomainScore(value, reverse = false) {
  const adjusted = reverse ? reverseScore(value) : value
  return adjusted * 20
}

// Validates that a response value is a finite number between 1 and 5 (inclusive).
// Returns null if the value is missing, non-numeric, or out of the expected range.
// Protects calculateSnapshotFromResponses from stale or partially-saved data.
function normalizeScore(value) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  if (numberValue < 1 || numberValue > 5) return null
  return numberValue
}

// ─────────────────────────────────────────────────────────────────────────────
// interpretScore
// ─────────────────────────────────────────────────────────────────────────────
// Returns a human-readable label for the overall score tier.
// Used in the Onboarding result card and the Dashboard pet speech bubble.
export function interpretScore(score) {
  if (score >= 75) return 'strong current habits'
  if (score >= 50) return 'moderate, room to improve'
  if (score >= 25) return 'noticeable strain or weaker habits'
  return 'priority area for support'
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateSnapshotFromResponses
// ─────────────────────────────────────────────────────────────────────────────
// Main scoring function for the onboarding questionnaire.
// Takes raw questionnaire responses { Q1, Q2, Q3, Q4 } and returns a full snapshot object.
// Returns null if any required response is missing or invalid.
//
// Return shape:
//   {
//     normalizedResponses: { Q1, Q2, Q3, Q4 },  // coerced 1-5 integers
//     domainScoresLatest:  Array<{ key, label, score }>,  // using new domain keys
//     domainScoresLegacy:  Array<{ key, label, score }>,  // using Dashboard-compatible keys
//     overallScore:        number,  // 0-100 average of adjusted domain values
//     overallInterpretation: string
//   }
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

  // Build adjusted raw values (post-reverse) to calculate the overall average.
  // Each adjusted value is in the 1-5 range; scaling by 20 converts to 0-100.
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

// ─────────────────────────────────────────────────────────────────────────────
// Scoring from daily check-in data
// Maps check-in field values to 0-100 scores for each domain.
// Social energy is kept from onboarding (Q4) since check-in doesn't capture it.
// ─────────────────────────────────────────────────────────────────────────────

// Maps sleep_hours string → score (0-100).
// '8' hours maps to the highest score (100); shorter or longer sleep scores lower.
// '9+' is slightly penalised (80) versus '8' because oversleeping can indicate disrupted rhythm.
function scoreSleep(sleepHours) {
  const map = {
    '< 6': 20,
    '6':   40,
    '7':   60,
    '8':   100,
    '9+':  80,
  }
  return map[sleepHours] ?? 50  // fallback 50 if an unexpected value is received
}

// Maps screen_time string → score (reverse: more screen = lower score).
// '< 2h' is the healthiest band (100); '8h+' is the worst (20).
function scoreScreen(screenTime) {
  const map = {
    '< 2h':  100,
    '2-4h':  80,
    '4-6h':  60,
    '6-8h':  40,
    '8h+':   20,
  }
  return map[screenTime] ?? 50
}

// Maps physical_activity boolean → score.
// Active = 100; no activity = 40 (not 0, because rest days are sometimes necessary).
function scoreActivity(physicalActivity) {
  return physicalActivity ? 100 : 40
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateSnapshotFromCheckin
// ─────────────────────────────────────────────────────────────────────────────
// Main function: takes today's check-in habit object + social score from onboarding.
// Returns a snapshot-shaped object compatible with the Dashboard component.
//
// Parameters:
//   habit       — { sleep_hours, screen_time, physical_activity } from HabitTracker
//   socialScore — the social_energy score from onboarding (carried forward, default 60)
//
// The social domain is intentionally excluded from daily check-ins because
// social connection quality is harder to capture in a single daily question.
export function calculateSnapshotFromCheckin(habit, socialScore = 60) {
  if (!habit) return null

  const sleepScore    = scoreSleep(habit.sleep_hours)
  const screenScore   = scoreScreen(habit.screen_time)
  const activityScore = scoreActivity(habit.physical_activity)

  // Assemble domain scores in the legacy key format expected by Dashboard.
  const domainScores = [
    { key: 'sleep_rhythm',    label: 'Sleep Rhythm',    score: sleepScore },
    { key: 'move_mode',       label: 'Move Mode',       score: activityScore },
    { key: 'cognitive_strain',label: 'Cognitive Strain',score: screenScore },
    { key: 'social_energy',   label: 'Social Energy',   score: socialScore },
  ]

  // Overall score = simple average of the four domain scores.
  const overallScore = Math.round(
    domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length
  )

  return {
    overallScore,
    overallInterpretation: interpretScore(overallScore),
    domainScores,
  }
}
