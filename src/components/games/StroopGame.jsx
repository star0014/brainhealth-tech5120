import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import './Game.css'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'

const COLORS = [
  { name: 'RED',    hex: '#ef4444', bg: '#fef2f2' },
  { name: 'BLUE',   hex: '#3b82f6', bg: '#eff6ff' },
  { name: 'GREEN',  hex: '#22c55e', bg: '#f0fdf4' },
  { name: 'YELLOW', hex: '#eab308', bg: '#fefce8' },
]

function getRandomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function generateRound() {
  const word = getRandomItem(COLORS)
  let color = getRandomItem(COLORS)
  if (Math.random() > 0.5) {
    const others = COLORS.filter(c => c.name !== word.name)
    color = getRandomItem(others)
  }
  return { word, color }
}

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
  const [phase, setPhase] = useState('intro')
  const [round, setRound] = useState(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [timeLeft, setTimeLeft] = useState(60)
  const [saved, setSaved] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const timerRef = useRef(null)

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

  useEffect(() => { if (phase === 'done') saveScore() }, [phase])

  async function saveScore() {
    try {
      const token = await getToken()
      if (!token) return
      await fetch(`${API}/games`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: 'stroop', score, metadata: { total_rounds: total, accuracy: total > 0 ? Math.round((score / total) * 100) : 0 } })
      })
      setSaved(true)
    } catch (err) { console.error(err) }
  }

  function handleAnswer(colorName) {
    if (!round || feedback) return
    const correct = colorName === round.color.name
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) {
      setScore(s => s + 1)
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > bestStreak) setBestStreak(newStreak)
    } else {
      setStreak(0)
    }
    setTotal(t => t + 1)
    setTimeout(() => { setFeedback(null); setRound(generateRound()) }, 350)
  }

  function reset() {
    setPhase('intro'); setScore(0); setTotal(0)
    setFeedback(null); setTimeLeft(60); setSaved(false)
    setStreak(0); setBestStreak(0)
  }

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
  const timerPct = (timeLeft / 60) * 100
  const timerColor = timeLeft > 20 ? '#f59e0b' : '#ef4444'

  function getRating() {
    if (accuracy >= 90) return { label: 'Exceptional Focus!', desc: 'Your attention control is outstanding.', color: '#16a34a' }
    if (accuracy >= 75) return { label: 'Great Attention!', desc: 'Strong cognitive control — well above average.', color: '#2563eb' }
    if (accuracy >= 60) return { label: 'Good Effort!', desc: 'Solid performance with room to improve.', color: '#7c3aed' }
    return { label: 'Keep Practicing!', desc: 'Regular practice will sharpen your focus.', color: '#d97706' }
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <button className="game-back" onClick={onBack}>← Back</button>
        <div className="game-title-area">
          <h1>Stroop Test</h1>
          <span className="game-skill">Attention Control</span>
        </div>
        <div className="game-rounds stroop-timer" style={{ color: timerColor, borderColor: timerColor + '40', background: timerColor + '10' }}>
          {phase === 'playing' ? `${timeLeft}s` : '60s'}
        </div>
      </div>

      {/* ── Intro ── */}
      {phase === 'intro' && (
        <div className="stroop-intro-card">
          <div className="stroop-intro-demo">
            <div className="stroop-demo-word" style={{ color: '#3b82f6' }}>RED</div>
            <div className="stroop-demo-arrow">→</div>
            <div className="stroop-demo-answer">
              <span>Select</span>
              <div className="stroop-demo-chip" style={{ background: '#eff6ff', color: '#3b82f6', border: '2px solid #3b82f6' }}>BLUE</div>
            </div>
          </div>
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
          <button className="stroop-start-btn" onClick={() => setPhase('playing')}>
            Start Game →
          </button>
        </div>
      )}

      {/* ── Playing ── */}
      {phase === 'playing' && round && (
        <div className="stroop-game">
          {/* Timer bar */}
          <div className="stroop-timer-track">
            <div className="stroop-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>

          {/* Stats row */}
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

          {/* Word display */}
          <div className={`stroop-word-card ${feedback || ''}`}>
            <div className="stroop-word-prompt">What colour is the text?</div>
            <div className="stroop-word-display" style={{ color: round.color.hex }}>
              {round.word.name}
            </div>
            {feedback && (
              <div className={`stroop-feedback-badge ${feedback}`}>
                {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong'}
              </div>
            )}
          </div>

          {/* Colour buttons */}
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

      {/* ── Done ── */}
      {phase === 'done' && (
        <div className="reaction-results">
          <h2>Time's Up!</h2>
          <div className="result-avg">
            <div className="result-avg-num">{accuracy}<span>%</span></div>
            <div className="result-avg-label">{score} correct out of {total} rounds · Best streak: {bestStreak} 🔥</div>
            <div className="result-rating" style={{ color: getRating().color }}>{getRating().label}</div>
            <div className="result-desc">{getRating().desc}</div>
          </div>
          {saved && <div className="result-saved">Score saved to your profile!</div>}
          <div className="result-actions">
            <button className="mg-play-btn" style={{ background: '#f59e0b' }} onClick={reset}>Play Again</button>
            <button className="game-back-btn" onClick={onBack}>Back to Games</button>
          </div>
        </div>
      )}

      {/* Other games */}
      <OtherGames onBack={onBack} />
    </div>
  )
}

export default StroopGame
