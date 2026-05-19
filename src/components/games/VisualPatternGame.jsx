// ─────────────────────────────────────────────────────────────────────────────
// VisualPatternGame — a Simon Says style grid memory game.
// A sequence of cells lights up one by one. The player must repeat the sequence
// by tapping the cells in the same order. Each round adds one more cell.
// Tests working memory and attention.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import './Game.css'
import { getDisplayName } from '../../utils/displayName'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'
const GRID_SIZE = 9 // 3x3 grid
const SHOW_DURATION = 600  // ms each cell lights up
const PAUSE_DURATION = 250 // ms between cells

const OtherGames = ({ onBack }) => (
  <div className="other-games">
    <div className="other-games-label">Try more games</div>
    <div className="other-games-row">
      <button className="other-game-card" onClick={onBack}>
        <div className="other-game-card-icon" style={{ background: '#2563eb15', border: '1px solid #2563eb30' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div className="other-game-card-info">
          <div className="other-game-card-name">Reaction Test</div>
          <div className="other-game-card-skill" style={{ color: '#2563eb' }}>Processing Speed</div>
        </div>
        <div className="other-game-card-arrow">→</div>
      </button>
      <button className="other-game-card" onClick={onBack}>
        <div className="other-game-card-icon" style={{ background: '#7c3aed15', border: '1px solid #7c3aed30' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
        </div>
        <div className="other-game-card-info">
          <div className="other-game-card-name">Memory Match</div>
          <div className="other-game-card-skill" style={{ color: '#7c3aed' }}>Working Memory</div>
        </div>
        <div className="other-game-card-arrow">→</div>
      </button>
    </div>
  </div>
)

function VisualPatternGame({ onBack }) {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [phase, setPhase] = useState('intro')   // intro | showing | input | correct | wrong | done
  const [sequence, setSequence] = useState([])  // the full sequence so far
  const [playerSeq, setPlayerSeq] = useState([]) // what the player has tapped
  const [activeCell, setActiveCell] = useState(null) // cell currently lit during show
  const [flashCell, setFlashCell] = useState(null)   // cell flashing on player tap
  const [level, setLevel] = useState(1)
  const [maxLevel, setMaxLevel] = useState(0)
  const [saved, setSaved] = useState(false)
  const [strictMode, setStrictMode] = useState(false)
  const timeouts = useRef([])

  function clearAllTimeouts() {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
  }

  const showSequence = useCallback((seq) => {
    setPhase('showing')
    setPlayerSeq([])
    let delay = 600

    seq.forEach((cell, i) => {
      const t1 = setTimeout(() => setActiveCell(cell), delay)
      const t2 = setTimeout(() => setActiveCell(null), delay + SHOW_DURATION)
      timeouts.current.push(t1, t2)
      delay += SHOW_DURATION + PAUSE_DURATION
    })

    const t3 = setTimeout(() => setPhase('input'), delay)
    timeouts.current.push(t3)
  }, [])

  function startGame() {
    clearAllTimeouts()
    const firstCell = Math.floor(Math.random() * GRID_SIZE)
    const newSeq = [firstCell]
    setSequence(newSeq)
    setLevel(1)
    setMaxLevel(0)
    setSaved(false)
    showSequence(newSeq)
  }

  function handleCellTap(cellIndex) {
    if (phase !== 'input') return

    setFlashCell(cellIndex)
    setTimeout(() => setFlashCell(null), 300)

    const newPlayerSeq = [...playerSeq, cellIndex]
    setPlayerSeq(newPlayerSeq)

    const pos = newPlayerSeq.length - 1

    if (cellIndex !== sequence[pos]) {
      // Wrong tap
      setPhase('wrong')
      const finalLevel = level - 1
      setMaxLevel(Math.max(maxLevel, finalLevel))
      setTimeout(() => setPhase('done'), 1200)
      saveScore(Math.max(maxLevel, finalLevel))
      return
    }

    if (newPlayerSeq.length === sequence.length) {
      // Completed this level
      const newLevel = level + 1
      setMaxLevel(Math.max(maxLevel, level))
      setPhase('correct')

      setTimeout(() => {
        const nextCell = Math.floor(Math.random() * GRID_SIZE)
        const newSeq = [...sequence, nextCell]
        setSequence(newSeq)
        setLevel(newLevel)
        showSequence(newSeq)
      }, 800)
    }
  }

  async function saveScore(finalLevel) {
    try {
      const token = await getToken()
      const guestId = !token ? localStorage.getItem('bb_guest_id') : null
      if (!token && !guestId) return
      const headers = token
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'X-Guest-ID': guestId, 'Content-Type': 'application/json' }
      await fetch(`${API}/games`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ game_id: 'visual_pattern', display_name: getDisplayName(user?.id, user?.firstName), score: finalLevel, metadata: { max_level: finalLevel } })
      })
      setSaved(true)
    } catch (err) { console.error(err) }
  }

  function getRating(lvl) {
    if (lvl >= 8) return { label: 'Exceptional Memory!', desc: 'Your working memory is outstanding — top tier.', color: '#16a34a' }
    if (lvl >= 6) return { label: 'Great Recall!', desc: 'Strong visual memory — well above average.', color: '#2563eb' }
    if (lvl >= 4) return { label: 'Good Effort!', desc: 'Solid performance with room to improve.', color: '#7c3aed' }
    return { label: 'Keep Practicing!', desc: 'Visual memory improves with regular practice.', color: '#d97706' }
  }

  const finalLevel = maxLevel

  return (
    <div className="game-page">
      <div className="game-header">
        <button className="game-back" onClick={onBack}>← Back</button>
        <div className="game-title-area">
          <h1>Visual Pattern</h1>
          <span className="game-skill" style={{ color: '#0891b2', background: '#e0f9ff' }}>Working Memory</span>
        </div>
        <div className="game-rounds" style={{ color: '#0891b2', borderColor: '#0891b240', background: '#e0f9ff' }}>
          Level {level}
        </div>
      </div>

      {phase === 'intro' && (
        <div className="stroop-intro-card">
          <div className="stroop-intro-demo">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: [1, 4, 7].includes(i) ? '#0891b2' : '#e0f9ff',
                  border: `2px solid ${[1,4,7].includes(i) ? '#0891b2' : '#0891b240'}`,
                  boxShadow: [1,4,7].includes(i) ? '0 4px 16px rgba(8,145,178,0.35)' : 'none'
                }} />
              ))}
            </div>
            <div className="stroop-demo-arrow">→</div>
            <div className="stroop-demo-answer">
              <span>Repeat</span>
              <div className="stroop-demo-chip" style={{ background: '#e0f9ff', color: '#0891b2', border: '2px solid #0891b2' }}>in order</div>
            </div>
          </div>
          <div className="stroop-intro-rules">
            <div className="stroop-rule">
              <span className="stroop-rule-icon">👀</span>
              <span>Watch the grid — cells will light up in a sequence</span>
            </div>
            <div className="stroop-rule">
              <span className="stroop-rule-icon">🧠</span>
              <span>Memorise the <strong>order</strong> the cells light up</span>
            </div>
            <div className="stroop-rule">
              <span className="stroop-rule-icon">👆</span>
              <span>Tap the cells in the <strong>same order</strong> to advance</span>
            </div>
            <div className="stroop-rule">
              <span className="stroop-rule-icon">📈</span>
              <span>Each correct round <strong>adds one more cell</strong> to remember</span>
            </div>
          </div>
          <button className="stroop-start-btn" style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)' }} onClick={startGame}>
            Start Game →
          </button>
        </div>
      )}

      {(phase === 'showing' || phase === 'input' || phase === 'correct' || phase === 'wrong') && (
        <div className="vp-game">
          <div className="vp-status-row">
            {phase === 'showing' && <div className="vp-status-pill showing">👀 Watch the sequence...</div>}
            {phase === 'input' && <div className="vp-status-pill input">👆 Your turn! Tap in order</div>}
            {phase === 'correct' && <div className="vp-status-pill correct">✓ Correct! Next level...</div>}
            {phase === 'wrong' && <div className="vp-status-pill wrong">✗ Wrong order!</div>}
          </div>

          <div className="vp-progress-row">
            {sequence.map((_, i) => (
              <div key={i} className={`vp-progress-dot ${i < playerSeq.length ? 'filled' : ''}`} />
            ))}
          </div>

          <div className="vp-grid">
            {Array.from({ length: GRID_SIZE }).map((_, i) => {
              const isActive = activeCell === i
              const isFlash = flashCell === i
              const isInPlayerSeq = playerSeq.includes(i)
              return (
                <button
                  key={i}
                  className={`vp-cell ${isActive ? 'active' : ''} ${isFlash ? 'flash' : ''} ${phase !== 'input' ? 'disabled' : ''}`}
                  onClick={() => handleCellTap(i)}
                  disabled={phase !== 'input'}
                />
              )
            })}
          </div>

          <div className="vp-level-info">
            Sequence length: <strong>{sequence.length}</strong>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="reaction-results">
          <h2>Game Over!</h2>
          <div className="result-avg">
            <div className="result-avg-num">{finalLevel}<span>levels</span></div>
            <div className="result-avg-label">You remembered sequences up to {finalLevel} cells long</div>
            <div className="result-rating" style={{ color: getRating(finalLevel).color }}>{getRating(finalLevel).label}</div>
            <div className="result-desc">{getRating(finalLevel).desc}</div>
          </div>
          {saved && <div className="result-saved">Score saved to your profile!</div>}
          <div className="result-actions">
            <button className="mg-play-btn" style={{ background: '#0891b2' }} onClick={startGame}>Play Again</button>
            <button className="game-back-btn" onClick={onBack}>Back to Games</button>
          </div>
        </div>
      )}

      <OtherGames onBack={onBack} />
    </div>
  )
}

export default VisualPatternGame
