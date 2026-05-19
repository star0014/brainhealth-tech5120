import { useState, useEffect } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import ReactionGame from '../components/games/ReactionGame'
import MemoryGame from '../components/games/MemoryGame'
import StroopGame from '../components/games/StroopGame'
import VisualPatternGame from '../components/games/VisualPatternGame'
import MentalMathGame from '../components/games/MentalMathGame'
import { getDisplayName } from '../utils/displayName'
import { GAME_ACHIEVEMENTS } from '../data/gameAchievements'
import './MiniGames.css'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'

function formatScore(gameId, score) {
  if (gameId === 'reaction') return `${score}ms`
  if (gameId === 'memory')   return `${score} moves`
  if (gameId === 'stroop')   return `${score}%`
  if (gameId === 'visual_pattern') return `Lvl ${score}`
  if (gameId === 'mental_math')    return `${score} correct`
  return score
}

function medal(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

const GAMES = [
  {
    id: 'reaction', title: 'Reaction Test', skill: 'Processing Speed',
    desc: 'Test how fast your brain can respond to a visual stimulus. Tap as soon as you see the green screen!',
    duration: '~1 min', color: '#2563eb', lowerIsBetter: true,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  },
  {
    id: 'memory', title: 'Memory Match', skill: 'Working Memory',
    desc: 'Flip cards and find matching pairs. Tests your short-term memory and concentration.',
    duration: '~2 min', color: '#7c3aed', lowerIsBetter: true,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
  },
  {
    id: 'stroop', title: 'Stroop Test', skill: 'Attention Control',
    desc: 'Select the colour of the text — not what the word says. Trains your focus and cognitive control.',
    duration: '~1 min', color: '#f59e0b', lowerIsBetter: false,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  },
  {
    id: 'visual_pattern', title: 'Visual Pattern', skill: 'Working Memory',
    desc: 'Watch a sequence of cells light up on a grid, then repeat the pattern from memory. Gets harder each round!',
    duration: '~2 min', color: '#0891b2', lowerIsBetter: false,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  },
  {
    id: 'mental_math', title: 'Mental Math', skill: 'Executive Function',
    desc: 'Solve rapid-fire arithmetic problems against the clock. Questions get harder as your streak grows!',
    duration: '~1 min', color: '#16a34a', lowerIsBetter: false,
    icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  }
]

// ── Leaderboard panel ────────────────────────────────────────────────────────
function Leaderboard({ currentUserId, currentUserFirstName }) {
  const [activeGame, setActiveGame] = useState('reaction')
  const [boards, setBoards] = useState({})
  const [loading, setLoading] = useState(false)
  const myName = getDisplayName(currentUserId, currentUserFirstName)

  useEffect(() => {
    if (boards[activeGame]) return
    setLoading(true)
    fetch(`${API}/games/leaderboard/${activeGame}`)
      .then(r => r.json())
      .then(data => { setBoards(prev => ({ ...prev, [activeGame]: Array.isArray(data) ? data : [] })); setLoading(false) })
      .catch(() => { setBoards(prev => ({ ...prev, [activeGame]: [] })); setLoading(false) })
  }, [activeGame])

  const game = GAMES.find(g => g.id === activeGame)
  const entries = boards[activeGame] || []

  return (
    <div className="mg-panel">
      <div className="mg-panel-header">
        <div className="mg-panel-title">🏆 Leaderboard</div>
        <div className="mg-panel-sub">Top 10 players by personal best score</div>
      </div>
      <div className="lb-tabs">
        {GAMES.map(g => (
          <button key={g.id} className={`lb-tab ${activeGame === g.id ? 'active' : ''}`}
            style={activeGame === g.id ? { borderColor: g.color, color: g.color } : {}}
            onClick={() => setActiveGame(g.id)}>{g.title}</button>
        ))}
      </div>
      <div className="lb-hint">{game?.lowerIsBetter ? '⬇ Lower score is better' : '⬆ Higher score is better'}</div>
      {loading ? (
        <div className="lb-loading">Loading scores...</div>
      ) : entries.length === 0 ? (
        <div className="lb-empty"><div className="lb-empty-icon">🎮</div><div>No scores yet — be the first to play!</div></div>
      ) : (
        <div className="lb-list">
          {entries.map((entry, i) => {
            const rank = i + 1
            const isMe = entry.user_id === currentUserId || entry.display_name === myName
            return (
              <div key={i} className={`lb-row ${rank <= 3 ? `lb-top-${rank}` : ''} ${isMe ? 'lb-me' : ''}`}>
                <div className="lb-rank">{medal(rank)}</div>
                <div className="lb-name">{entry.display_name}{isMe && <span className="lb-you-badge">You</span>}</div>
                <div className="lb-score" style={{ color: game?.color }}>{formatScore(activeGame, entry.best_score)}</div>
              </div>
            )
          })}
        </div>
      )}
      <div className="lb-footer">Your name on the leaderboard: <strong>{myName}</strong></div>
    </div>
  )
}

// ── Achievements panel ───────────────────────────────────────────────────────
function Achievements({ gameScores }) {
  const unlocked = GAME_ACHIEVEMENTS.filter(a => a.condition(gameScores))

  return (
    <div className="mg-panel">
      <div className="mg-panel-header">
        <div className="mg-panel-title">🏅 Achievements</div>
        <div className="mg-panel-sub">{unlocked.length}/{GAME_ACHIEVEMENTS.length} unlocked — keep playing to earn more</div>
      </div>
      <div className="achievements-grid">
        {GAME_ACHIEVEMENTS.map(a => {
          const isUnlocked = a.condition(gameScores)
          return (
            <div key={a.id} className={`achievement-card rarity-${a.rarity} ${isUnlocked ? 'unlocked' : 'locked'}`}>
              <div className="achievement-emoji">{isUnlocked ? a.emoji : '🔒'}</div>
              <div className="achievement-body">
                <div className="achievement-label">{a.label}</div>
                <div className="achievement-desc">{isUnlocked ? a.desc : a.hint}</div>
              </div>
              <div className={`achievement-rarity-badge rarity-${a.rarity}`}>{a.rarity}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main MiniGames page ──────────────────────────────────────────────────────
function MiniGames() {
  const [activeGame, setActiveGame] = useState(null)
  const [activeTab, setActiveTab] = useState('games') // 'games' | 'leaderboard' | 'achievements'
  const [gameScores, setGameScores] = useState([])
  const { user } = useUser()
  const { getToken } = useAuth()

  // Ensure display name is initialised on mount for both guests and signed-in users.
  // getDisplayName uses per-identity localStorage keys so the name never changes.
  useEffect(() => {
    getDisplayName(user?.id, user?.firstName)
  }, [user?.id])

  // Fetch game scores so achievements can evaluate conditions
  useEffect(() => {
    async function load() {
      try {
        const token = await getToken()
        if (!token) return // guest users don't save scores to API — achievements stay locked
        const res = await fetch(`${API}/games`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (Array.isArray(data)) setGameScores(data)
      } catch { /* silently fail */ }
    }
    load()
  }, [user])

  if (activeGame === 'reaction')       return <ReactionGame onBack={() => setActiveGame(null)} />
  if (activeGame === 'memory')         return <MemoryGame onBack={() => setActiveGame(null)} />
  if (activeGame === 'stroop')         return <StroopGame onBack={() => setActiveGame(null)} />
  if (activeGame === 'visual_pattern') return <VisualPatternGame onBack={() => setActiveGame(null)} />
  if (activeGame === 'mental_math')    return <MentalMathGame onBack={() => setActiveGame(null)} />

  return (
    <div className="mg-page">
      {/* Hero */}
      <div className="mg-hero">
        <div className="mg-hero-text">
          <h1>Cognitive Games</h1>
          <p>Short brain training exercises designed to sharpen your focus, memory and reaction speed.</p>
        </div>
        <div className="mg-hero-visual">
          <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" width="160" height="130">
            <circle cx="80" cy="65" r="50" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
            <rect x="55" y="45" width="50" height="38" rx="4" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
            <rect x="60" y="50" width="18" height="12" rx="2" fill="#93c5fd"/>
            <rect x="82" y="50" width="18" height="12" rx="2" fill="#93c5fd"/>
            <rect x="60" y="66" width="18" height="12" rx="2" fill="#bfdbfe"/>
            <rect x="82" y="66" width="18" height="12" rx="2" fill="#2563eb">
              <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
            </rect>
            <line x1="80" y1="83" x2="80" y2="95" stroke="#3b82f6" strokeWidth="2"/>
            <line x1="65" y1="95" x2="95" y2="95" stroke="#3b82f6" strokeWidth="2"/>
          </svg>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="mg-tabs">
        {[
          { id: 'games',        label: '🎮 Games' },
          { id: 'leaderboard',  label: '🏆 Leaderboard' },
          { id: 'achievements', label: '🏅 Achievements' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`mg-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'games' && (
        <div className="mg-grid">
          {GAMES.map(g => (
            <div key={g.id} className="mg-card">
              <div className="mg-card-icon" style={{ background: `${g.color}15`, border: `1px solid ${g.color}30` }}>
                {g.icon}
              </div>
              <div className="mg-card-content">
                <div className="mg-card-header">
                  <h2>{g.title}</h2>
                  <span className="mg-duration">{g.duration}</span>
                </div>
                <div className="mg-skill" style={{ color: g.color }}>{g.skill}</div>
                <p>{g.desc}</p>
                <button className="mg-play-btn" style={{ background: g.color }} onClick={() => setActiveGame(g.id)}>
                  Play Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'leaderboard' && <Leaderboard currentUserId={user?.id} currentUserFirstName={user?.firstName} />}
      {activeTab === 'achievements' && <Achievements gameScores={gameScores} />}
    </div>
  )
}

export default MiniGames
