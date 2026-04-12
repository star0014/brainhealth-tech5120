export function getSnapshot() {
  const storedSnapshot = localStorage.getItem('brainboostSnapshot')
  return storedSnapshot ? JSON.parse(storedSnapshot) : null
}

export function getPriorityDomains(snapshot, count = 2) {
  if (!snapshot?.domainScores?.length) return []

  return [...snapshot.domainScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map((domain) => domain.key)
}

export function getRecommendedArticles(snapshot, articles, limit = 4) {
  const priorityDomains = getPriorityDomains(snapshot, 2)
  if (!priorityDomains.length) return articles.slice(0, limit)

  const ranked = [...articles].sort((left, right) => {
    const leftRank = priorityDomains.indexOf(left.topic)
    const rightRank = priorityDomains.indexOf(right.topic)
    const normalizedLeft = leftRank === -1 ? Number.MAX_SAFE_INTEGER : leftRank
    const normalizedRight = rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank
    return normalizedLeft - normalizedRight
  })

  return ranked.slice(0, limit)
}
