// ─────────────────────────────────────────────────────────────────────────────
// Article Hub page — shows all articles with topic filters and a personalised
// recommendations panel based on the user's lowest-scoring domains.
//
// Layout:
//   1. Page header (title + sub-copy)
//   2. Recommendations panel — only rendered if a snapshot exists in localStorage.
//      Shows up to 4 articles ordered by the user's weakest domains.
//   3. Topic filter buttons — 'All' plus one button per domain.
//   4. Article card grid — filtered by the selected topic.
//   5. Article detail modal — appears when a card is clicked; closes on overlay click or ×.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react'
import { ARTICLES, TOPIC_META } from '../data/articles'
import { getRecommendedArticles, getSnapshot } from '../utils/recommendations'
import './ArticleHub.css'

// All valid filter options — 'all' shows every article.
// The order here matches the order of filter buttons rendered in the UI.
const FILTERS = ['all', 'sleep_rhythm', 'move_mode', 'cognitive_strain', 'social_energy']

function ArticleHub() {
  const [filter,   setFilter]   = useState('all')     // currently selected topic filter
  const [selected, setSelected] = useState(null)      // article open in the modal (null = closed)

  // Load the saved snapshot to personalise the recommendations panel.
  // getSnapshot() reads from localStorage — safe to call on every render.
  const snapshot = getSnapshot()

  // Only recompute recommended articles when the snapshot changes.
  // useMemo prevents re-sorting the entire ARTICLES array on every keystroke or filter click.
  const recommendedArticles = useMemo(
    () => getRecommendedArticles(snapshot, ARTICLES, 4),
    [snapshot],
  )

  // Filter the full article list by topic; show all if filter is 'all'.
  const filtered =
    filter === 'all' ? ARTICLES : ARTICLES.filter((article) => article.topic === filter)

  return (
    <div className="hub-wrap">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="hub-header">
        <div className="hub-title">Article Hub</div>
        <div className="hub-sub">
          Smart reads for your real life, picked to support the parts of your brain health snapshot
          that need the most attention.
        </div>
      </div>

      {/* ── Personalised recommendations panel ─────────────────────────────── */}
      {/* Only shown when a snapshot exists (i.e. the user has completed onboarding).
          The panel lists up to 4 articles prioritised by the user's weakest domains. */}
      {snapshot && (
        <div className="recommendation-panel">
          <div className="recommendation-eyebrow">Recommended for your score</div>
          <div className="recommendation-copy">
            Based on your latest snapshot, these articles focus first on the lower-scoring areas most
            likely to affect study, energy, stress, and social wellbeing.
          </div>
          {/* Pill-style buttons that open the article detail modal directly */}
          <div className="recommended-grid">
            {recommendedArticles.map((article) => (
              <button
                key={`recommended-${article.id}`}
                type="button"
                className="recommended-pill"
                onClick={() => setSelected(article)}
              >
                {/* Coloured topic chip using the same CSS class as article cards */}
                <span className={`recommended-topic ${article.topic}`}>
                  {TOPIC_META[article.topic].shortLabel}
                </span>
                <span>{article.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Topic filter buttons ─────────────────────────────────────────────── */}
      {/* 'active' class highlights the currently selected filter */}
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

      {/* ── Main article grid ────────────────────────────────────────────────── */}
      {/* Each card opens the article modal on click.
          The article.topic CSS class drives the colour-coded cover banner. */}
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
                {/* Source badge: CSS class (e.g. 'headspace', 'who') drives its colour */}
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

      {/* ── Article detail modal ─────────────────────────────────────────────── */}
      {/* Clicking the semi-transparent overlay closes the modal.
          Clicking inside the modal box does not close it (stopPropagation). */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          {/* stopPropagation prevents clicks inside the box from bubbling to the overlay close handler */}
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            {/* Coloured top accent bar — colour is driven by the article's topic CSS class */}
            <div className={`modal-bar ${selected.topic}`}></div>
            <div className="modal-header">
              <div>
                <div className="modal-meta">
                  <span className={`source-badge ${selected.sourceBadge}`}>{selected.source}</span>
                  <span className="read-time">{selected.readTime}</span>
                </div>
                <div className="modal-title">{selected.title}</div>
              </div>
              {/* × button in the top-right corner of the modal */}
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
                {/* Opens the original article in a new tab.
                    rel="noreferrer" prevents referrer leakage and tab-napping. */}
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
