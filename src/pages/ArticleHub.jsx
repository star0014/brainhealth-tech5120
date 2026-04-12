import { useMemo, useState } from 'react'
import { ARTICLES, TOPIC_META } from '../data/articles'
import { getRecommendedArticles, getSnapshot } from '../utils/recommendations'
import './ArticleHub.css'

const FILTERS = ['all', 'sleep_rhythm', 'move_mode', 'cognitive_strain', 'social_energy']

function ArticleHub() {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const snapshot = getSnapshot()

  const recommendedArticles = useMemo(
    () => getRecommendedArticles(snapshot, ARTICLES, 4),
    [snapshot],
  )

  const filtered =
    filter === 'all' ? ARTICLES : ARTICLES.filter((article) => article.topic === filter)

  return (
    <div className="hub-wrap">
      <div className="hub-header">
        <div className="hub-title">Article Hub</div>
        <div className="hub-sub">
          Smart reads for your real life, picked to support the parts of your brain health snapshot
          that need the most attention.
        </div>
      </div>

      {snapshot && (
        <div className="recommendation-panel">
          <div className="recommendation-eyebrow">Recommended for your score</div>
          <div className="recommendation-copy">
            Based on your latest snapshot, these articles focus first on the lower-scoring areas most
            likely to affect study, energy, stress, and social wellbeing.
          </div>
          <div className="recommended-grid">
            {recommendedArticles.map((article) => (
              <button
                key={`recommended-${article.id}`}
                type="button"
                className="recommended-pill"
                onClick={() => setSelected(article)}
              >
                <span className={`recommended-topic ${article.topic}`}>
                  {TOPIC_META[article.topic].shortLabel}
                </span>
                <span>{article.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="filter-row">
        {FILTERS.map((filterKey) => (
          <button
            key={filterKey}
            type="button"
            className={`filter-btn ${filter === filterKey ? 'active' : ''}`}
            onClick={() => setFilter(filterKey)}
          >
            {filterKey === 'all' ? 'All topics' : TOPIC_META[filterKey].label}
          </button>
        ))}
      </div>

      <div className="articles-grid">
        {filtered.map((article) => (
          <button
            key={article.id}
            type="button"
            className="article-card"
            onClick={() => setSelected(article)}
          >
            <div className={`article-cover ${article.topic}`}>
              <img className="article-cover-img" src={article.image} alt={article.title} />
              <div className="article-cover-label">{TOPIC_META[article.topic].label}</div>
            </div>
            <div className="article-body">
              <div className="article-meta">
                <span className={`source-badge ${article.sourceBadge}`}>{article.source}</span>
                <span className="read-time">{article.readTime}</span>
              </div>
              <div className="article-title">{article.title}</div>
              <div className="article-summary">{article.summary}</div>
              <span className={`article-tag ${article.topic}`}>{TOPIC_META[article.topic].shortLabel}</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className={`modal-bar ${selected.topic}`}></div>
            <div className="modal-header">
              <div>
                <div className="modal-meta">
                  <span className={`source-badge ${selected.sourceBadge}`}>{selected.source}</span>
                  <span className="read-time">{selected.readTime}</span>
                </div>
                <div className="modal-title">{selected.title}</div>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelected(null)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <img className="modal-hero-img" src={selected.image} alt={selected.title} />
              <div className="modal-summary">{selected.summary}</div>
              <div className="modal-source-box">
                <div>
                  <div className="modal-source-label">Source</div>
                  <div className="modal-source-name">{selected.source}</div>
                </div>
                <a
                  className="modal-source-link"
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open source
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArticleHub
