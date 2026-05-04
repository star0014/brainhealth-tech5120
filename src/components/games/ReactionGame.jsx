// ─────────────────────────────────────────────────────────────────────────────
// ReactionGame component — measures processing speed via a visual reaction task.
//
// Rules:
//   - 5 rounds total.
//   - Each round: the screen is grey (WAITING/READY), then turns green (GO).
//   - The player must tap as fast as possible when they see green.
//   - Tapping before green (READY state) counts as a false start (TOOSOON).
//   - Reaction time (ms) is recorded for each successful round.
//   - Final score = average of all 5 reaction times.
//
// Scoring metric: average reaction time in milliseconds. Lower = better.
// Score is saved to /api/games at the end of round 5.
//
// State machine:
//   WAITING  → player taps to start → READY
//   READY    → player taps too early → TOOSOON
//   READY    → timer fires → GO
//   GO       → player taps → RESULT
//   RESULT   → player taps → READY (next round) or final results if round=5
//   TOOSOON  → player taps → READY (retry)
//
// Props:
//   onBack — callback to return to the MiniGames hub
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import './Game.css'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'

// State machine constants — named for readability and to prevent magic strings.
const STATES = { WAITING: 'waiting', READY: 'ready', GO: 'go', RESULT: 'result', TOOSOON: 'toosoon' }

// OtherGames: cross-game navigation shortcuts at the bottom of the game page.
const OtherGames = ({ onBack }) => (
  <div className="other-games">
    <div className="other-games-label">Try more games</div>
    <div className="other-games-row">
      <button className="other-game-btn" onClick={onBack}>
        <span className="other-game-name">Memory Match</span>
        <span className="other-game-sub">Working Memory</span>
      </button>
      <button className="other-game-btn" onClick={onBack}>
        <span className="other-game-name">Stroop Test</span>
        <span className="other-game-sub">Attention Control</span>
      </button>
    </div>
  </div>
)

function ReactionGame({ onBack }) {
  const { getToken } = useAuth()

  const [state,        setState]        = useState(STATES.WAITING)  // current phase of the state machine
  const [reactionTime, setReactionTime] = useState(null)            // most recent round's reaction time (ms)
  const [results,      setResults]      = useState([])              // array of reaction times for all rounds
  const [round,        setRound]        = useState(0)               // how many rounds have been completed
  const [saved,        setSaved]        = useState(false)           // true after score is saved to API

  // Refs instead of state: these values are read inside async callbacks / setTimeout
  // and must not trigger re-renders.
  const startTime = useRef(null)   // Date.now() timestamp when the screen turned green
  const timer     = useRef(null)   // setTimeout ID for the random GO delay

  const TOTAL_ROUNDS = 5

  // startRound: transitions to READY state and sets a random 2-5 second delay before GO.
  // The random delay prevents players from anticipating the exact trigger moment.
  function startRound() {
    setState(STATES.READY)
    const delay = 2000 + Math.random() * 3000  // 2 000 – 5 000 ms
    timer.current = setTimeout(() => {
      setState(STATES.GO)
      startTime.current = Date.now()  // record the moment the screen turned green
    }, delay)
  }

  // Saves the average reaction time (and all individual round times) to the API.
  async function saveScore(avgMs, allResults) {
    try {
      const token = await getToken()
      if (!token) return  // guest users — no Clerk token, skip saving
      await fetch(`${API}/games`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: 'reaction',
          score: avgMs,           // primary metric stored in the score column
          metadata: { rounds: allResults }  // per-round breakdown stored in metadata
        })
      })
      setSaved(true)
    } catch (err) {
      console.error(err)
    }
  }

  // handleClick: the main interaction handler — behaviour changes based on current state.
  function handleClick() {
    if (state === STATES.WAITING) {
      // Player taps to begin — start the first/next round.
      startRound()

    } else if (state === STATES.READY) {
      // Player tapped before the screen turned green — false start.
      clearTimeout(timer.current)  // cancel the pending GO transition
      setState(STATES.TOOSOON)

    } else if (state === STATES.GO) {
      // Successful reaction: record the time elapsed since the screen turned green.
      const rt = Date.now() - startTime.current
      setReactionTime(rt)
      const newResults = [...results, rt]
      setResults(newResults)
      const newRound = round + 1
      setRound(newRound)
      setState(STATES.RESULT)

      // After the last round, calculate the average and save to the API.
      if (newRound >= TOTAL_ROUNDS) {
        const avg = Math.round(newResults.reduce((a, b) => a + b, 0) / newResults.length)
        saveScore(avg, newResults)
      }

    } else if (state === STATES.RESULT || state === STATES.TOOSOON) {
      // Between rounds: player taps to continue to the next round.
      if (round >= TOTAL_ROUNDS) return  // all rounds done — ignore taps
      startRound()
    }
  }

  // reset: reinitialises all state for "Play Again".
  function reset() {
    clearTimeout(timer.current)
    setState(STATES.WAITING)
    setResults([])
    setRound(0)
    setReactionTime(null)
    setSaved(false)
  }

  // Derived values used in the results screen.
  const avg  = results.length > 0 ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : null
  const done = round >= TOTAL_ROUNDS  // true when all 5 rounds are complete

  // Returns rating metadata for a given reaction time in milliseconds.
  function getRating(ms) {
    if (ms < 200) return { label: 'Exceptional!', desc: 'Your processing speed is in the top tier.', color: '#16a34a' }
    if (ms < 250) return { label: 'Great!', desc: 'Your reaction time is well above average.', color: '#2563eb' }
    if (ms < 300) return { label: 'Good', desc: 'Your reaction speed is solid.', color: '#7c3aed' }
    if (ms < 350) return { label: 'Average', desc: 'Room to improve with regular practice.', color: '#d97706' }
    return { label: 'Keep Practicing', desc: 'Try again after a good night\'s sleep!', color: '#94a3b8' }
  }

  return (
    <div className="game-page">
      {/* Header: back button, title, round counter */}
      <div className="game-header">
        <button className="game-back" onClick={onBack}>← Back</button>
        <div className="game-title-area">
          <h1>Reaction Test</h1>
          <span className="game-skill">Processing Speed</span>
        </div>
        <div className="game-rounds">{round} / {TOTAL_ROUNDS}</div>
      </div>

      {/* ── Active game area ──────────────────────────────────────────────────── */}
      {/* The reaction-box CSS class is extended with the state name to drive background colour:
          .reaction-box.waiting → grey, .reaction-box.go → green, etc. */}
      {!done ? (
        <div className={`reaction-box ${state}`} onClick={handleClick}>
          {/* WAITING: invite the player to start */}
          {state === STATES.WAITING && (
            <div className="reaction-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <p>Tap to Start</p>
              <span>React as fast as you can when the screen turns green</span>
            </div>
          )}
          {/* READY: three animated dots — player must hold off tapping */}
          {state === STATES.READY && (
            <div className="reaction-content">
              <div className="reaction-dots"><span/><span/><span/></div>
              <p>Wait for green...</p>
              <span>Don't tap yet!</span>
            </div>
          )}
          {/* GO: large "TAP!" prompt — player should react immediately */}
          {state === STATES.GO && (
            <div className="reaction-content">
              <p className="reaction-go">TAP!</p>
            </div>
          )}
          {/* RESULT: shows this round's reaction time and rating */}
          {state === STATES.RESULT && (
            <div className="reaction-content">
              <div className="reaction-time">{reactionTime}<span>ms</span></div>
              <p>{getRating(reactionTime).label}</p>
              <span>Tap to continue</span>
            </div>
          )}
          {/* TOOSOON: player tapped before the screen turned green */}
          {state === STATES.TOOSOON && (
            <div className="reaction-content">
              <p>Too soon!</p>
              <span>Wait for green. Tap to try again.</span>
            </div>
          )}
        </div>
      ) : (
        /* ── Results screen ─────────────────────────────────────────────────── */
        <div className="reaction-results">
          <h2>Your Results</h2>
          <div className="result-avg">
            {/* Average reaction time — the primary score metric */}
            <div className="result-avg-num">{avg}<span>ms</span></div>
            <div className="result-avg-label">Average Reaction Time</div>
            <div className="result-rating" style={{ color: getRating(avg).color }}>{getRating(avg).label}</div>
            <div className="result-desc">{getRating(avg).desc}</div>
          </div>
          {/* Per-round breakdown table */}
          <div className="result-rounds">
            {results.map((r, i) => (
              <div key={i} className="result-round">
                <span>Round {i + 1}</span>
                <span style={{ color: getRating(r).color }}>{r}ms — {getRating(r).label}</span>
              </div>
            ))}
          </div>
          {/* Confirmation shown only after the API call succeeds */}
          {saved && <div className="result-saved">Score saved to your profile!</div>}
          <div className="result-actions">
            <button className="mg-play-btn" style={{ background: '#2563eb' }} onClick={reset}>Play Again</button>
            <button className="game-back-btn" onClick={onBack}>Back to Games</button>
          </div>
        </div>
      )}

      {/* Cross-game navigation shortcuts */}
      <OtherGames onBack={onBack} />
    </div>
  )
}

export default ReactionGame
