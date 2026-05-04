// ─────────────────────────────────────────────────────────────────────────────
// StroopGame component — a 60-second attention-control game based on the Stroop effect.
//
// Rules:
//   - A colour word (e.g. "RED") is displayed in a possibly-different ink colour (e.g. blue).
//   - The player must select the button matching the INK COLOUR, not the word text.
//   - This cognitive conflict (reading word vs. perceiving colour) trains attention control.
//   - 60 seconds total. Score = accuracy percentage (correct / total * 100).
//
// Conflict rate: ~50% of rounds have a word/colour mismatch. The other ~50% have
// word === colour (congruent), which acts as a control and maintains variety.
//
// Props:
//   onBack       — callback to return to the MiniGames hub
//   onSwitchGame — unused but kept for forward-compatibility with future hub designs
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import './Game.css'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'

// Four colours used in both the word text and the ink colour.
// hex: the actual colour applied to the word via style.color.
// bg:  a soft tint used as the button background.
const COLORS = [
  { name: 'RED',    hex: '#ef4444', bg: '#fef2f2' },
  { name: 'BLUE',   hex: '#3b82f6', bg: '#eff6ff' },
  { name: 'GREEN',  hex: '#22c55e', bg: '#f0fdf4' },
  { name: 'YELLOW', hex: '#eab308', bg: '#fefce8' },
]

// Returns a random element from an array.
function getRandomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// Generates one round: { word, color }.
//   word  — which colour name to display as text.
//   color — which ink colour to render the word in.
// 50% chance of mismatch (incongruent): forces the player to override the reading reflex.
// 50% congruent: word and ink colour match (easier, provides breathing room).
function generateRound() {
  const word = getRandomItem(COLORS)
  let color  = getRandomItem(COLORS)
  if (Math.random() > 0.5) {
    // Force mismatch: pick a colour different from the word.
    const others = COLORS.filter(c => c.name !== word.name)
    color = getRandomItem(others)
  }
  return { word, color }
}

// OtherGames: cross-game navigation shortcuts at the bottom of the game page.
const OtherGames = ({ onBack }) => (
  <div className="other-games">
    <div className="other-games-label">Try more games</div>
    <div className="other-games-row">
      <button className="other-game-btn" onClick={onBack} data-color="#2563eb">
        <span className="other-game-name">Reaction Test</span>
        <span className="other-game-sub">Processing Speed</span>
      </button>
      <button className="other-game-btn" onClick={onBack} data-color="#7c3aed">
        <span className="other-game-name">Memory Match</span>
        <span className="other-game-sub">Working Memory</span>
      </button>
    </div>
  </div>
)

function StroopGame({ onBack, onSwitchGame }) {
  const { getToken } = useAuth()

  // phase: 'intro' → show instructions; 'playing' → active game; 'done' → results
  const [phase,      setPhase]      = useState('intro')
  const [round,      setRound]      = useState(null)       // current round: { word, color }
  const [score,      setScore]      = useState(0)          // number of correct answers
  const [total,      setTotal]      = useState(0)          // total answers given (correct + wrong)
  const [feedback,   setFeedback]   = useState(null)       // 'correct' | 'wrong' | null
  const [timeLeft,   setTimeLeft]   = useState(60)         // countdown seconds
  const [saved,      setSaved]      = useState(false)      // true after score saved to API
  const [streak,     setStreak]     = useState(0)          // current consecutive correct answers
  const [bestStreak, setBestStreak] = useState(0)          // longest streak in this session
  const timerRef = useRef(null)                            // setInterval ID for the countdown

  // Start the game timer and generate the first round when phase changes to 'playing'.
  // The cleanup function clears the interval on unmount or phase change.
  useEffect(() => {
    if (phase === 'playing') {
      setRound(generateRound())
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setPhase('done'); return 0 }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  // Save the score as soon as the game phase transitions to 'done'.
  useEffect(() => { if (phase === 'done') saveScore() }, [phase])

  // Saves accuracy score and round metadata to the API.
  async function saveScore() {
    try {
      const token = await getToken()
      if (!token) return  // guest users — no Clerk token, skip saving
      await fetch(`${API}/games`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: 'stroop',
          score,  // correct answers count (raw); accuracy % is in metadata
          metadata: {
            total_rounds: total,
            accuracy: total > 0 ? Math.round((score / total) * 100) : 0
          }
        })
      })
      setSaved(true)
    } catch (err) { console.error(err) }
  }

  // handleAnswer: processes the player's colour button tap.
  // Correct = ink colour name matches the chosen button; wrong = mismatch.
  // A brief feedback overlay ('correct'/'wrong') is shown for 350 ms.
  function handleAnswer(colorName) {
    if (!round || feedback) return  // ignore taps while feedback is showing

    const correct = colorName === round.color.name  // compare button name to INK colour (not word)
    setFeedback(correct ? 'correct' : 'wrong')

    if (correct) {
      setScore(s => s + 1)
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > bestStreak) setBestStreak(newStreak)  // track best streak
    } else {
      setStreak(0)  // reset streak on wrong answer
    }

    setTotal(t => t + 1)
    // Clear feedback and generate next round after 350 ms.
    setTimeout(() => { setFeedback(null); setRound(generateRound()) }, 350)
  }

  // reset: reinitialises all state for "Play Again".
  function reset() {
    setPhase('intro'); setScore(0); setTotal(0)
    setFeedback(null); setTimeLeft(60); setSaved(false)
    setStreak(0); setBestStreak(0)
  }

  // Derived values used in the playing and results screens.
  const accuracy   = total > 0 ? Math.round((score / total) * 100) : 0
  const timerPct   = (timeLeft / 60) * 100  // timer bar width as a percentage
  // Timer bar turns red in the last 20 seconds as a visual urgency cue.
  const timerColor = timeLeft > 20 ? '#f59e0b' : '#ef4444'

  // Returns rating metadata based on accuracy percentage.
  function getRating() {
    if (accuracy >= 90) return { label: 'Exceptional Focus!', desc: 'Your attention control is outstanding.', color: '#16a34a' }
    if (accuracy >= 75) return { label: 'Great Attention!', desc: 'Strong cognitive control — well above average.', color: '#2563eb' }
    if (accuracy >= 60) return { label: 'Good Effort!', desc: 'Solid performance with room to improve.', color: '#7c3aed' }
    return { label: 'Keep Practicing!', desc: 'Regular practice will sharpen your focus.', color: '#d97706' }
  }

  return (
    <div className="game-page">
      {/* Header: back button, title, countdown timer */}
      <div className="game-header">
        <button className="game-back" onClick={onBack}>← Back</button>
        <div className="game-title-area">
          <h1>Stroop Test</h1>
          <span className="game-skill">Attention Control</span>
        </div>
        {/* Timer badge: colour and border change from amber to red in the final 20 seconds */}
        <div className="game-rounds stroop-timer" style={{ color: timerColor, borderColor: timerColor + '40', background: timerColor + '10' }}>
          {phase === 'playing' ? `${timeLeft}s` : '60s'}
        </div>
      </div>

      {/* ── Intro phase ──────────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <div className="stroop-intro-card">
          {/* Visual demo: word "RED" shown in blue ink → select BLUE */}
          <div className="stroop-intro-demo">
            <div className="stroop-demo-word" style={{ color: '#3b82f6' }}>RED</div>
            <div className="stroop-demo-arrow">→</div>
            <div className="stroop-demo-answer">
              <span>Select</span>
              <div className="stroop-demo-chip" style={{ background: '#eff6ff', color: '#3b82f6', border: '2px solid #3b82f6' }}>BLUE</div>
            </div>
          </div>
          {/* Three rules explaining how to play */}
          <div className="stroop-intro-rules">
            <div className="stroop-rule">
              <span className="stroop-rule-icon">👁</span>
              <span>Read the <strong>colour of the text</strong>, not the word itself</span>
            </div>
            <div className="stroop-rule">
              <span className="stroop-rule-icon">⚡</span>
              <span>Answer as <strong>fast and accurately</strong> as possible</span>
            </div>
            <div className="stroop-rule">
              <span className="stroop-rule-icon">⏱</span>
              <span>You have <strong>60 seconds</strong> — go for a high score!</span>
            </div>
          </div>
          {/* Start button: transitions phase to 'playing', mounting the timer */}
          <button className="stroop-start-btn" onClick={() => setPhase('playing')}>
            Start Game →
          </button>
        </div>
      )}

      {/* ── Playing phase ─────────────────────────────────────────────────────── */}
      {phase === 'playing' && round && (
        <div className="stroop-game">
          {/* Countdown progress bar — shrinks from full width to 0 over 60 seconds */}
          <div className="stroop-timer-track">
            <div className="stroop-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>

          {/* Live stats: current score, accuracy, and streak */}
          <div className="stroop-stats-row">
            <div className="stroop-stat-box">
              <div className="stroop-stat-num">{score}</div>
              <div className="stroop-stat-lbl">Score</div>
            </div>
            <div className="stroop-stat-box">
              <div className="stroop-stat-num">{accuracy}%</div>
              <div className="stroop-stat-lbl">Accuracy</div>
            </div>
            <div className="stroop-stat-box">
              <div className="stroop-stat-num" style={{ color: '#f59e0b' }}>{streak}</div>
              <div className="stroop-stat-lbl">Streak 🔥</div>
            </div>
          </div>

          {/* Word display card.
              The word text is round.word.name (e.g. "RED") but rendered in round.color.hex (e.g. blue).
              This is the core Stroop interference: the player must ignore what the word SAYS
              and respond to the colour it IS DISPLAYED IN. */}
          <div className={`stroop-word-card ${feedback || ''}`}>
            <div className="stroop-word-prompt">What colour is the text?</div>
            <div className="stroop-word-display" style={{ color: round.color.hex }}>
              {round.word.name}
            </div>
            {/* Brief feedback overlay — green checkmark for correct, red × for wrong */}
            {feedback && (
              <div className={`stroop-feedback-badge ${feedback}`}>
                {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong'}
              </div>
            )}
          </div>

          {/* Four colour answer buttons.
              CSS custom properties --btn-color and --btn-bg drive the button's accent colour. */}
          <div className="stroop-color-grid">
            {COLORS.map(c => (
              <button
                key={c.name}
                className="stroop-color-btn"
                style={{ '--btn-color': c.hex, '--btn-bg': c.bg }}
                onClick={() => handleAnswer(c.name)}
              >
                <span className="stroop-color-dot" style={{ background: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Done phase ────────────────────────────────────────────────────────── */}
      {phase === 'done' && (
        <div className="reaction-results">
          <h2>Time's Up!</h2>
          <div className="result-avg">
            {/* Primary metric: accuracy percentage */}
            <div className="result-avg-num">{accuracy}<span>%</span></div>
            <div className="result-avg-label">{score} correct out of {total} rounds · Best streak: {bestStreak} 🔥</div>
            <div className="result-rating" style={{ color: getRating().color }}>{getRating().label}</div>
            <div className="result-desc">{getRating().desc}</div>
          </div>
          {/* Confirmation shown only after the API call succeeds */}
          {saved && <div className="result-saved">Score saved to your profile!</div>}
          <div className="result-actions">
            <button className="mg-play-btn" style={{ background: '#f59e0b' }} onClick={reset}>Play Again</button>
            <button className="game-back-btn" onClick={onBack}>Back to Games</button>
          </div>
        </div>
      )}

      {/* Cross-game navigation shortcuts */}
      <OtherGames onBack={onBack} />
    </div>
  )
}

export default StroopGame
