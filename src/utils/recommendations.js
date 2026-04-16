// Utilities for reading the saved snapshot and generating article recommendations.
import { calculateSnapshotFromResponses } from './scoring'

// Reads the questionnaire snapshot saved in localStorage after onboarding.
// Returns null if nothing is saved or the stored value is not valid JSON.
export function getSnapshot() {
  const storedSnapshot = localStorage.getItem('brainboostSnapshot')
  if (!storedSnapshot) return null

  try {
    return JSON.parse(storedSnapshot)
  } catch {
    return null
  }
}

// A user is considered "onboarding-complete" only if:
// 1) the explicit completion flag is true, and
// 2) the stored responses still produce a valid score shape.
export function hasCompletedOnboarding(snapshot = getSnapshot()) {
  if (!snapshot?.onboardingCompleted) return false

  const scoringInput = snapshot.questionnaireResponses ?? snapshot.responses
  return Boolean(calculateSnapshotFromResponses(scoringInput))
}

// Returns the keys of the lowest-scoring domains, sorted worst-first.
// Used to decide which topics to prioritise in article recommendations.
export function getPriorityDomains(snapshot, count = 2) {
  if (!snapshot?.domainScores?.length) return []

  return [...snapshot.domainScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map((domain) => domain.key)
}

// Sorts articles so that topics matching the user's weakest domains appear first.
// Falls back to the natural article order if no snapshot is available.
export function getRecommendedArticles(snapshot, articles, limit = 4) {
  const priorityDomains = getPriorityDomains(snapshot, 2)
  if (!priorityDomains.length) return articles.slice(0, limit)

  const ranked = [...articles].sort((left, right) => {
    const leftRank = priorityDomains.indexOf(left.topic)
    const rightRank = priorityDomains.indexOf(right.topic)
    // Articles whose topic is not in the priority list are pushed to the end
    const normalizedLeft  = leftRank  === -1 ? Number.MAX_SAFE_INTEGER : leftRank
    const normalizedRight = rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank
    return normalizedLeft - normalizedRight
  })

  return ranked.slice(0, limit)
}
