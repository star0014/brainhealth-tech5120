const DOMAIN_CONFIG = {
  sleep_rhythm: { questionId: 'Q1', label: 'Sleep Rhythm', reverse: false },
  move_mode: { questionId: 'Q2', label: 'Move Mode', reverse: false },
  screen_exposure: { questionId: 'Q3', label: 'Screen Exposure', reverse: true },
  social_energy: { questionId: 'Q4', label: 'Social Energy', reverse: false },
}

const LEGACY_DOMAIN_KEYS = {
  sleep_rhythm: 'sleep_rhythm',
  move_mode: 'move_mode',
  screen_exposure: 'cognitive_strain',
  social_energy: 'social_energy',
}

function reverseScore(value) {
  return 6 - value
}

function calculateDomainScore(value, reverse = false) {
  const adjusted = reverse ? reverseScore(value) : value
  return adjusted * 20
}

function normalizeScore(value) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  if (numberValue < 1 || numberValue > 5) return null
  return numberValue
}

export function interpretScore(score) {
  if (score >= 75) return 'strong current habits'
  if (score >= 50) return 'moderate, room to improve'
  if (score >= 25) return 'noticeable strain or weaker habits'
  return 'priority area for support'
}

export function calculateSnapshotFromResponses(responses) {
  if (!responses) return null

  const normalizedResponses = {
    Q1: normalizeScore(responses.Q1),
    Q2: normalizeScore(responses.Q2),
    Q3: normalizeScore(responses.Q3),
    Q4: normalizeScore(responses.Q4),
  }

  if (Object.values(normalizedResponses).some((value) => value == null)) {
    return null
  }

  const domainScoresLatest = Object.entries(DOMAIN_CONFIG).map(([key, config]) => ({
    key,
    label: config.label,
    score: calculateDomainScore(normalizedResponses[config.questionId], config.reverse),
  }))

  const adjustedScores = Object.values(DOMAIN_CONFIG).map((config) =>
    config.reverse
      ? reverseScore(normalizedResponses[config.questionId])
      : normalizedResponses[config.questionId],
  )

  const overallScore = Math.round(
    (adjustedScores.reduce((sum, value) => sum + value, 0) / adjustedScores.length) * 20,
  )

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
