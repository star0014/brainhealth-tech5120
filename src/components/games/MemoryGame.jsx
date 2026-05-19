// ─────────────────────────────────────────────────────────────────────────────
// MemoryGame component — a flip-card matching game that tests working memory.
//
// Rules:
//   - 16 cards are laid out face-down (8 icon pairs, shuffled).
//   - The player flips two cards per turn.
//   - If they match, they stay face-up (matched state).
//   - If they don't match, they flip back over after 1 second.
//   - The game ends when all 8 pairs are matched.
//
// Scoring metric: total number of flip attempts (moves). Fewer = better.
// Score is saved to /api/games at game end (authenticated users only).
//
// Props:
//   onBack — callback invoked when the user presses the ← Back button
//            or one of the "Try more games" shortcuts.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import './Game.css'
import { getDisplayName } from '../../utils/displayName'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'

// Eight unique icons — each appears twice in the deck (16 cards total).
const ICONS = ['🧠', '⚡', '🎯', '🔥', '💡', '🌙', '⭐', '🎮']

// Returns a new shuffled copy of the array using the Fisher-Yates via sort trick.
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

// ── OtherGames ────────────────────────────────────────────────────────────────
// Small "Try more games" section rendered at the bottom of each game.
// Clicking either button calls onBack, returning to the MiniGames hub
// where the user can then select a different game.
const OtherGames = ({ onBack }) => (
  <div className="other-games">
    <div className="other-games-label">Try more games</div>

    <div className="other-games-row">

      {/* Reaction Test */}
      <button className="other-game-card" onClick={onBack}>
        <div
          className="other-game-card-icon"
          style={{
            background: '#2563eb15',
            border: '1px solid #2563eb30'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>

        <div className="other-game-card-info">
          <div className="other-game-card-name">Reaction Test</div>
          <div className="other-game-card-skill" style={{ color: '#2563eb' }}>
            Processing Speed
          </div>
        </div>

        <div className="other-game-card-arrow">→</div>
      </button>

      {/* Stroop Test */}
      <button className="other-game-card" onClick={onBack}>
        <div
          className="other-game-card-icon"
          style={{
            background: '#f59e0b15',
            border: '1px solid #f59e0b30'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <div className="other-game-card-info">
          <div className="other-game-card-name">Stroop Test</div>
          <div className="other-game-card-skill" style={{ color: '#f59e0b' }}>
            Attention Control
          </div>
        </div>

        <div className="other-game-card-arrow">→</div>
      </button>

    </div>
  </div>
)

// Creates the initial 16-card deck: two copies of ICONS merged and shuffled.
// Each card object: { id (index), icon, flipped (face-up?), matched (permanently up?) }
function createCards() {
  return shuffle([...ICONS, ...ICONS]).map((icon, i) => ({ id: i, icon, flipped: false, matched: false }))
}

function MemoryGame({ onBack }) {
  const { getToken } = useAuth()
  const { user } = useUser()

  const [cards,     setCards]     = useState(createCards())  // all 16 card objects
  const [phase, setPhase] = useState('intro')
  const [selected,  setSelected]  = useState([])             // 0 or 1 cards currently flipped by the player
  const [moves,     setMoves]     = useState(0)              // total flip attempts (the score)
  const [done,      setDone]      = useState(false)          // true when all pairs are matched
  const [startTime, setStartTime] = useState(null)
  const [elapsed,   setElapsed]   = useState(0)              // seconds since start (for the timer display)
  const [locked,    setLocked]    = useState(false)          // blocks clicks while a non-match is animating
  const [saved,     setSaved]     = useState(false)          // true after score is successfully submitted

  // Increment elapsed every second until the game is done.
  useEffect(() => {
    if (done || phase !== 'playing') return

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [done, phase])

  // When all cards are matched, set done=true and save the score.
  useEffect(() => {
    if (cards.every(c => c.matched) && cards.length > 0) {
      setDone(true)
      saveScore()
    }
  }, [cards])

  // Saves the final score (moves count) to the API.
  // Also records time_seconds as metadata.
  // Silently does nothing for guest users (getToken returns null without a Clerk session).
  async function saveScore() {
    try {
      const token = await getToken()
      const guestId = !token ? localStorage.getItem('bb_guest_id') : null
      if (!token && !guestId) return
      const headers = token
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'X-Guest-ID': guestId, 'Content-Type': 'application/json' }
      const finalMoves = moves
      const finalTime  = Math.floor((Date.now() - startTime) / 1000)
      await fetch(`${API}/games`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          game_id: 'memory',
          display_name: getDisplayName(user?.id, user?.firstName),
          score: finalMoves,
          metadata: { time_seconds: finalTime }
        })
      })
      setSaved(true)
    } catch (err) {
      console.error(err)
    }
  }

  // handleCardClick: processes a card tap.
  // Guards: ignore if board is locked, card already face-up, or card already matched,
  //         or if the user taps the same card twice.
  function handleCardClick(card) {
    if (locked || card.flipped || card.matched) return
    if (selected.length === 1 && selected[0].id === card.id) return  // same card tapped twice

    // Flip the clicked card face-up.
    const newCards    = cards.map(c => c.id === card.id ? { ...c, flipped: true } : c)
    const newSelected = [...selected, card]
    setCards(newCards)
    setSelected(newSelected)

    if (newSelected.length === 2) {
      setMoves(m => m + 1)   // count this as one move (pair of flips)
      setLocked(true)        // prevent further clicks until the result is resolved

      if (newSelected[0].icon === newSelected[1].icon) {
        // Match: mark both cards as permanently matched after a short delay.
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === newSelected[0].id || c.id === newSelected[1].id ? { ...c, matched: true } : c
          ))
          setSelected([])
          setLocked(false)
        }, 500)
      } else {
        // No match: flip both cards back over after 1 second so the player can see them.
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === newSelected[0].id || c.id === newSelected[1].id ? { ...c, flipped: false } : c
          ))
          setSelected([])
          setLocked(false)
        }, 1000)
      }
    }
  }

  // reset: reinitialises the game state for "Play Again".
  function reset() {
    setCards(createCards())
    setSelected([])
    setMoves(0)
    setDone(false)
    setElapsed(0)
    setLocked(false)
    setSaved(false)
  }

  // Formats elapsed seconds as M:SS (e.g. 90 → "1:30").
  const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  // Returns rating metadata based on the number of moves.
  function getRating() {
    if (moves <= 12) return { label: 'Exceptional Memory!', desc: 'Outstanding — your working memory is top tier.', color: '#16a34a' }
    if (moves <= 16) return { label: 'Great Job!', desc: 'Strong memory performance — well above average.', color: '#2563eb' }
    if (moves <= 20) return { label: 'Good Effort!', desc: 'Solid performance with room to improve.', color: '#7c3aed' }
    return { label: 'Keep Practicing!', desc: 'Practice regularly to sharpen your memory.', color: '#d97706' }
  }

  return (
    <div className="game-page">
      {/* Header: back button, title, and live timer */}
      <div className="game-header">
        <button className="game-back" onClick={onBack}>← Back</button>
        <div className="game-title-area">
          <h1>Memory Match</h1>
          <span className="game-skill">Working Memory</span>
        </div>
        <div className="game-rounds">{formatTime(elapsed)}</div>
      </div>

      {/* ── Intro Screen ───────────────────────────────────────────────────── */}
      {phase === 'intro' ? (

        <div className="stroop-intro-card">

          <div className="stroop-intro-demo">

            <div style={{ display: 'flex', gap: 14 }}>

              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 34,
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.3)'
                }}
              >
                🧠
              </div>

              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 34,
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.3)'
                }}
              >
                🧠
              </div>

            </div>

            <div className="stroop-demo-arrow">→</div>

            <div className="stroop-demo-answer">
              <span>Find</span>

              <div
                className="stroop-demo-chip"
                style={{
                  background: '#f3e8ff',
                  color: '#7c3aed',
                  border: '2px solid #7c3aed'
                }}
              >
                Matching Pairs
              </div>
            </div>

          </div>

          <div className="stroop-intro-rules">

            <div className="stroop-rule">
              <span className="stroop-rule-icon">🧠</span>
              <span>
                Flip cards to reveal hidden symbols
              </span>
            </div>

            <div className="stroop-rule">
              <span className="stroop-rule-icon">🎯</span>
              <span>
                Find all the <strong>matching pairs</strong>
              </span>
            </div>

            <div className="stroop-rule">
              <span className="stroop-rule-icon">⚡</span>
              <span>
                Finish in as <strong>few moves</strong> as possible
              </span>
            </div>

            <div className="stroop-rule">
              <span className="stroop-rule-icon">⏱</span>
              <span>
                Your moves and completion time are tracked
              </span>
            </div>

          </div>

          <button
            className="stroop-start-btn"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              boxShadow: '0 8px 24px rgba(124,58,237,0.35)'
            }}
            onClick={() => {
              setStartTime(Date.now())
              setPhase('playing')
            }}
          >
            Start Game →
          </button>

        </div>

      ) : !done ? (
        <>
          {/* Move and match counters above the grid */}
          <div className="memory-stats">
            <span>Moves: <strong>{moves}</strong></span>
            <span>Matched: <strong>{cards.filter(c => c.matched).length / 2} / {ICONS.length}</strong></span>
          </div>

          {/* 4×4 card grid.
              CSS 3D flip animation is triggered by the 'flipped' class on .memory-card. */}
          <div className="memory-grid">
            {cards.map(card => (
              <div
                key={card.id}
                className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                onClick={() => handleCardClick(card)}
              >
                <div className="memory-card-inner">
                  {/* Front face: shown when the card is face-down */}
                  <div className="memory-card-front">?</div>
                  {/* Back face: shown when the card is flipped; reveals the icon */}
                  <div className="memory-card-back">{card.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ── Results screen ─────────────────────────────────────────────────── */
        <div className="reaction-results">
          <h2>Well Done!</h2>
          <div className="result-avg">
            <div className="result-avg-num">{moves}<span>moves</span></div>
            <div className="result-avg-label">Completed in {formatTime(elapsed)}</div>
            <div className="result-rating" style={{ color: getRating().color }}>{getRating().label}</div>
            <div className="result-desc">{getRating().desc}</div>
          </div>
          {/* Confirmation that the score was successfully saved to the user's profile */}
          {saved && <div className="result-saved">Score saved to your profile!</div>}
          <div className="result-actions">
            <button className="mg-play-btn" style={{ background: '#7c3aed' }} onClick={reset}>Play Again</button>
            <button className="game-back-btn" onClick={onBack}>Back to Games</button>
          </div>
        </div>
      )}

      {/* Cross-game navigation shortcuts at the bottom */}
      <OtherGames onBack={onBack} />
    </div>
  )
}

export default MemoryGame
