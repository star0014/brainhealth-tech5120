import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import './Game.css'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'
const ICONS = ['🧠', '⚡', '🎯', '🔥', '💡', '🌙', '⭐', '🎮']

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

const OtherGames = ({ onBack }) => (
  <div className="other-games">
    <div className="other-games-label">Try more games</div>
    <div className="other-games-row">
      <button className="other-game-btn" onClick={onBack}>
        <span className="other-game-name">Reaction Test</span>
        <span className="other-game-sub">Processing Speed</span>
      </button>
      <button className="other-game-btn" onClick={onBack}>
        <span className="other-game-name">Stroop Test</span>
        <span className="other-game-sub">Attention Control</span>
      </button>
    </div>
  </div>
)

function createCards() {
  return shuffle([...ICONS, ...ICONS]).map((icon, i) => ({ id: i, icon, flipped: false, matched: false }))
}

function MemoryGame({ onBack }) {
  const { getToken } = useAuth()
  const [cards, setCards] = useState(createCards())
  const [selected, setSelected] = useState([])
  const [moves, setMoves] = useState(0)
  const [done, setDone] = useState(false)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [locked, setLocked] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (done) return
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [done])

  useEffect(() => {
    if (cards.every(c => c.matched) && cards.length > 0) {
      setDone(true)
      saveScore()
    }
  }, [cards])

  async function saveScore() {
    try {
      const token = await getToken()
      if (!token) return
      const finalMoves = moves
      const finalTime = Math.floor((Date.now() - startTime) / 1000)
      await fetch(`${API}/games`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: 'memory',
          score: finalMoves,
          metadata: { time_seconds: finalTime }
        })
      })
      setSaved(true)
    } catch (err) {
      console.error(err)
    }
  }

  function handleCardClick(card) {
    if (locked || card.flipped || card.matched) return
    if (selected.length === 1 && selected[0].id === card.id) return
    const newCards = cards.map(c => c.id === card.id ? { ...c, flipped: true } : c)
    const newSelected = [...selected, card]
    setCards(newCards)
    setSelected(newSelected)
    if (newSelected.length === 2) {
      setMoves(m => m + 1)
      setLocked(true)
      if (newSelected[0].icon === newSelected[1].icon) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === newSelected[0].id || c.id === newSelected[1].id ? { ...c, matched: true } : c
          ))
          setSelected([])
          setLocked(false)
        }, 500)
      } else {
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

  function reset() {
    setCards(createCards())
    setSelected([])
    setMoves(0)
    setDone(false)
    setElapsed(0)
    setLocked(false)
    setSaved(false)
  }

  const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  function getRating() {
    if (moves <= 12) return { label: 'Exceptional Memory!', desc: 'Outstanding — your working memory is top tier.', color: '#16a34a' }
    if (moves <= 16) return { label: 'Great Job!', desc: 'Strong memory performance — well above average.', color: '#2563eb' }
    if (moves <= 20) return { label: 'Good Effort!', desc: 'Solid performance with room to improve.', color: '#7c3aed' }
    return { label: 'Keep Practicing!', desc: 'Practice regularly to sharpen your memory.', color: '#d97706' }
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <button className="game-back" onClick={onBack}>← Back</button>
        <div className="game-title-area">
          <h1>Memory Match</h1>
          <span className="game-skill">Working Memory</span>
        </div>
        <div className="game-rounds">{formatTime(elapsed)}</div>
      </div>

      {!done ? (
        <>
          <div className="memory-stats">
            <span>Moves: <strong>{moves}</strong></span>
            <span>Matched: <strong>{cards.filter(c => c.matched).length / 2} / {ICONS.length}</strong></span>
          </div>
          <div className="memory-grid">
            {cards.map(card => (
              <div key={card.id} className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`} onClick={() => handleCardClick(card)}>
                <div className="memory-card-inner">
                  <div className="memory-card-front">?</div>
                  <div className="memory-card-back">{card.icon}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="reaction-results">
          <h2>Well Done!</h2>
          <div className="result-avg">
            <div className="result-avg-num">{moves}<span>moves</span></div>
            <div className="result-avg-label">Completed in {formatTime(elapsed)}</div>
            <div className="result-rating" style={{ color: getRating().color }}>{getRating().label}</div>
            <div className="result-desc">{getRating().desc}</div>
          </div>
          {saved && <div className="result-saved">Score saved to your profile!</div>}
          <div className="result-actions">
            <button className="mg-play-btn" style={{ background: '#7c3aed' }} onClick={reset}>Play Again</button>
            <button className="game-back-btn" onClick={onBack}>Back to Games</button>
          </div>
        </div>
      )}
      <OtherGames onBack={onBack} />
    </div>
  )
}

export default MemoryGame
