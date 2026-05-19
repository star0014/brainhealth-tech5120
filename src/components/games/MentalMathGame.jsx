// ─────────────────────────────────────────────────────────────────────────────
// MentalMathGame — rapid mental arithmetic with 4-choice answers.
// Player has 60 seconds to answer as many questions as possible.
// Difficulty increases as streak grows.
// Tests processing speed and executive function.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import './Game.css'
import { getDisplayName } from '../../utils/displayName'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'

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
        <div className="other-game-card-icon" style={{ background: '#f59e0b15', border: '1px solid #f59e0b30' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="other-game-card-info">
          <div className="other-game-card-name">Stroop Test</div>
          <div className="other-game-card-skill" style={{ color: '#f59e0b' }}>Attention Control</div>
        </div>
        <div className="other-game-card-arrow">→</div>
      </button>
    </div>
  </div>
)

function generateQuestion(streak) {
  const difficulty = Math.min(Math.floor(streak / 3), 3)
  const ops = difficulty < 2 ? ['+', '-'] : ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]

  let a, b, answer

  if (op === '+') {
    const max = difficulty === 0 ? 20 : difficulty === 1 ? 50 : 99
    a = Math.floor(Math.random() * max) + 1
    b = Math.floor(Math.random() * max) + 1
    answer = a + b
  } else if (op === '-') {
    const max = difficulty === 0 ? 20 : difficulty === 1 ? 50 : 99
    a = Math.floor(Math.random() * max) + 10
    b = Math.floor(Math.random() * (a - 1)) + 1
    answer = a - b
  } else {
    const maxA = difficulty === 2 ? 9 : 12
    const maxB = difficulty === 2 ? 9 : 12
    a = Math.floor(Math.random() * maxA) + 2
    b = Math.floor(Math.random() * maxB) + 2
    answer = a * b
  }

  // Generate 3 wrong answers
  const wrongs = new Set()
  while (wrongs.size < 3) {
    const offset = Math.floor(Math.random() * 10) + 1
    const wrong = Math.random() > 0.5 ? answer + offset : answer - offset
    if (wrong !== answer && wrong > 0) wrongs.add(wrong)
  }

  const options = [...wrongs, answer].sort(() => Math.random() - 0.5)

  return { a, b, op, answer, options }
}

function MentalMathGame({ onBack }) {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [phase, setPhase] = useState('intro')
  const [question, setQuestion] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [total, setTotal] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [feedback, setFeedback] = useState(null) // { correct, chosen, answer }
  const [saved, setSaved] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (phase === 'playing') {
      setQuestion(generateQuestion(0))
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

  function handleAnswer(chosen) {
    if (feedback) return
    const correct = chosen === question.answer
    setFeedback({ correct, chosen, answer: question.answer })
    setTotal(t => t + 1)

    if (correct) {
      setScore(s => s + 1)
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > bestStreak) setBestStreak(newStreak)
    } else {
      setStreak(0)
    }

    setTimeout(() => {
      setFeedback(null)
      setQuestion(generateQuestion(correct ? streak + 1 : 0))
    }, 400)
  }

  async function saveScore() {
    try {
      const token = await getToken()
      const guestId = !token ? localStorage.getItem('bb_guest_id') : null
      if (!token && !guestId) return
      const headers = token
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'X-Guest-ID': guestId, 'Content-Type': 'application/json' }
      const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
      await fetch(`${API}/games`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ game_id: 'mental_math', display_name: getDisplayName(user?.id, user?.firstName), score, metadata: { total, accuracy, best_streak: bestStreak } })
      })
      setSaved(true)
    } catch (err) { console.error(err) }
  }

  function reset() {
    setPhase('intro'); setScore(0); setStreak(0); setBestStreak(0)
    setTotal(0); setTimeLeft(60); setFeedback(null); setSaved(false)
  }

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
  const timerPct = (timeLeft / 60) * 100
  const timerColor = timeLeft > 20 ? '#16a34a' : '#ef4444'

  function getRating() {
    if (score >= 25) return { label: 'Lightning Fast!', desc: 'Exceptional mental arithmetic speed and accuracy.', color: '#16a34a' }
    if (score >= 18) return { label: 'Sharp Mind!', desc: 'Strong calculation speed — well above average.', color: '#2563eb' }
    if (score >= 12) return { label: 'Good Effort!', desc: 'Solid maths skills with room to grow.', color: '#7c3aed' }
    return { label: 'Keep Practicing!', desc: 'Daily mental maths will sharpen your processing speed.', color: '#d97706' }
  }

  function getOpSymbol(op) { return op }

  return (
    <div className="game-page">
      <div className="game-header">
        <button className="game-back" onClick={onBack}>← Back</button>
        <div className="game-title-area">
          <h1>Mental Math</h1>
          <span className="game-skill" style={{ color: '#16a34a', background: '#f0fdf4' }}>Executive Function</span>
        </div>
        <div className="game-rounds stroop-timer" style={{ color: timerColor, borderColor: timerColor + '40', background: timerColor + '10' }}>
          {phase === 'playing' ? `${timeLeft}s` : '60s'}
        </div>
      </div>

      {phase === 'intro' && (
        <div className="stroop-intro-card">
          <div className="stroop-intro-demo">
            <div className="stroop-demo-word" style={{ color: '#16a34a', fontSize: 48 }}>14 + 27</div>
            <div className="stroop-demo-arrow">→</div>
            <div className="stroop-demo-answer">
              <span>Answer</span>
              <div className="stroop-demo-chip" style={{ background: '#f0fdf4', color: '#16a34a', border: '2px solid #16a34a' }}>41</div>
            </div>
          </div>
          <div className="stroop-intro-rules">
            <div className="stroop-rule">
              <span className="stroop-rule-icon">🔢</span>
              <span>A maths problem appears — solve it <strong>mentally</strong></span>
            </div>
            <div className="stroop-rule">
              <span className="stroop-rule-icon">⚡</span>
              <span>Tap the <strong>correct answer</strong> as fast as you can</span>
            </div>
            <div className="stroop-rule">
              <span className="stroop-rule-icon">📈</span>
              <span>Questions get <strong>harder</strong> as your streak grows</span>
            </div>
            <div className="stroop-rule">
              <span className="stroop-rule-icon">⏱</span>
              <span>You have <strong>60 seconds</strong> — go for a high score!</span>
            </div>
          </div>
          <button className="stroop-start-btn" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 8px 24px rgba(22,163,74,0.3)' }} onClick={() => setPhase('playing')}>
            Start Game →
          </button>
        </div>
      )}

      {phase === 'playing' && question && (
        <div className="stroop-game">
          {/* Timer bar */}
          <div className="stroop-timer-track">
            <div className="stroop-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>

          {/* Stats */}
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

          {/* Question */}
          <div className={`stroop-word-card ${feedback ? (feedback.correct ? 'correct' : 'wrong') : ''}`}>
            <div className="stroop-word-prompt">What is the answer?</div>
            <div className="mm-question">
              {question.a} {question.op} {question.b}
            </div>
            {feedback && (
              <div className={`stroop-feedback-badge ${feedback.correct ? 'correct' : 'wrong'}`}>
                {feedback.correct ? '✓ Correct!' : `✗ Answer was ${feedback.answer}`}
              </div>
            )}
          </div>

          {/* Answer buttons */}
          <div className="mm-options">
            {question.options.map((opt, i) => {
              let btnClass = 'mm-opt-btn'
              if (feedback) {
                if (opt === feedback.answer) btnClass += ' correct'
                else if (opt === feedback.chosen && !feedback.correct) btnClass += ' wrong'
                else btnClass += ' dimmed'
              }
              return (
                <button key={i} className={btnClass} onClick={() => handleAnswer(opt)}>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="reaction-results">
          <h2>Time's Up!</h2>
          <div className="result-avg">
            <div className="result-avg-num">{score}<span>correct</span></div>
            <div className="result-avg-label">{accuracy}% accuracy · Best streak: {bestStreak} 🔥</div>
            <div className="result-rating" style={{ color: getRating().color }}>{getRating().label}</div>
            <div className="result-desc">{getRating().desc}</div>
          </div>
          {saved && <div className="result-saved">Score saved to your profile!</div>}
          <div className="result-actions">
            <button className="mg-play-btn" style={{ background: '#16a34a' }} onClick={reset}>Play Again</button>
            <button className="game-back-btn" onClick={onBack}>Back to Games</button>
          </div>
        </div>
      )}

      <OtherGames onBack={onBack} />
    </div>
  )
}

export default MentalMathGame
