// ─────────────────────────────────────────────────────────────────────────────
// Recommendation utilities — reads the onboarding snapshot and generates
// personalised article recommendations for the Article Hub and Dashboard.
// ─────────────────────────────────────────────────────────────────────────────
// Utilities for reading the saved snapshot and generating article recommendations.
import { calculateSnapshotFromResponses } from './scoring'

// ─────────────────────────────────────────────────────────────────────────────
// getSnapshot
// ─────────────────────────────────────────────────────────────────────────────
// Reads the questionnaire snapshot saved in localStorage after onboarding.
// Returns null if nothing is saved or the stored value is not valid JSON.
//
// The snapshot is stored under 'brainboostSnapshot' and has this shape:
//   {
//     onboardingCompleted: boolean,
//     completedAt: ISO string,
//     questionnaireVersion: string,
//     responses: { Q1, Q2, Q3, Q4, Q4_social },
//     questionnaireResponses: { Q1, Q2, Q3, Q4 },
//     overallScore: number,
//     overallInterpretation: string,
//     domainScores: Array<{ key, label, score }>
//   }
export function getSnapshot() {
  const storedSnapshot = localStorage.getItem('brainboostSnapshot')
  if (!storedSnapshot) return null

  try {
    return JSON.parse(storedSnapshot)
  } catch {
    // If the stored string is corrupted or not valid JSON, treat it as absent.
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// hasCompletedOnboarding
// ─────────────────────────────────────────────────────────────────────────────
// A user is considered "onboarding-complete" only if:
//   1. the explicit completion flag (onboardingCompleted) is true, AND
//   2. the stored responses still produce a valid score shape when re-scored.
// Condition 2 guards against stale or partially-saved snapshots from earlier
// app versions that had different question structures.
export function hasCompletedOnboarding(snapshot = getSnapshot()) {
  if (!snapshot?.onboardingCompleted) return false

  // Support both the current key (questionnaireResponses) and the legacy key (responses).
  const scoringInput = snapshot.questionnaireResponses ?? snapshot.responses
  return Boolean(calculateSnapshotFromResponses(scoringInput))
}

// ─────────────────────────────────────────────────────────────────────────────
// getPriorityDomains
// ─────────────────────────────────────────────────────────────────────────────
// Returns the keys of the lowest-scoring domains, sorted worst-first.
// Used to decide which article topics to prioritise in recommendations.
//
// Example: if sleep_rhythm=40, move_mode=80, cognitive_strain=20, social_energy=60
//   getPriorityDomains(snapshot, 2) → ['cognitive_strain', 'sleep_rhythm']
export function getPriorityDomains(snapshot, count = 2) {
  if (!snapshot?.domainScores?.length) return []

  return [...snapshot.domainScores]
    .sort((a, b) => a.score - b.score)  // ascending: lowest score first
    .slice(0, count)
    .map((domain) => domain.key)
}

// ─────────────────────────────────────────────────────────────────────────────
// getRecommendedArticles
// ─────────────────────────────────────────────────────────────────────────────
// Sorts articles so that topics matching the user's weakest domains appear first.
// Falls back to the natural article order if no snapshot is available.
//
// Parameters:
//   snapshot  — the stored onboarding snapshot (or null)
//   articles  — the full ARTICLES array from data/articles.js
//   limit     — maximum number of articles to return (default 4)
//
// Sorting logic:
//   Articles whose topic matches priority domain 0 get rank 0 (first).
//   Articles whose topic matches priority domain 1 get rank 1 (second).
//   Articles not in the priority list get rank MAX_SAFE_INTEGER (last).
export function getRecommendedArticles(snapshot, articles, limit = 4) {
  const priorityDomains = getPriorityDomains(snapshot, 2)
  if (!priorityDomains.length) return articles.slice(0, limit)

  const ranked = [...articles].sort((left, right) => {
    const leftRank  = priorityDomains.indexOf(left.topic)
    const rightRank = priorityDomains.indexOf(right.topic)
    // Articles whose topic is not in the priority list are pushed to the end
    const normalizedLeft  = leftRank  === -1 ? Number.MAX_SAFE_INTEGER : leftRank
    const normalizedRight = rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank
    return normalizedLeft - normalizedRight
  })

  return ranked.slice(0, limit)
}

// Ranks short Dashboard insight cards by the user's weakest domains.
export function getRecommendedInsights(snapshot, insights, limit = 3) {
  const priorityDomains = getPriorityDomains(snapshot, 2)
  if (!priorityDomains.length) return insights.slice(0, limit)

  const ranked = [...insights].sort((left, right) => {
    const leftRank  = priorityDomains.indexOf(left.topic)
    const rightRank = priorityDomains.indexOf(right.topic)
    const normalizedLeft  = leftRank  === -1 ? Number.MAX_SAFE_INTEGER : leftRank
    const normalizedRight = rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank
    return normalizedLeft - normalizedRight
  })

  return ranked.slice(0, limit)
}
