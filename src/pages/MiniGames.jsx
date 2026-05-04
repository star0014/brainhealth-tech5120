import { useState } from 'react'
import ReactionGame from '../components/games/ReactionGame'
import MemoryGame from '../components/games/MemoryGame'
import StroopGame from '../components/games/StroopGame'
import './MiniGames.css'

function MiniGames() {
  const [activeGame, setActiveGame] = useState(null)

  const games = [
    {
      id: 'reaction',
      title: 'Reaction Test',
      skill: 'Processing Speed',
      desc: 'Test how fast your brain can respond to a visual stimulus. Tap as soon as you see the green screen!',
      duration: '~1 min',
      color: '#2563eb',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      )
    },
    {
      id: 'memory',
      title: 'Memory Match',
      skill: 'Working Memory',
      desc: 'Flip cards and find matching pairs. Tests your short-term memory and concentration.',
      duration: '~2 min',
      color: '#7c3aed',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
      )
    },
    {
      id: 'stroop',
      title: 'Stroop Test',
      skill: 'Attention Control',
      desc: 'Select the colour of the text — not what the word says. Trains your focus and cognitive control.',
      duration: '~1 min',
      color: '#f59e0b',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      )
    }
  ]

  if (activeGame === 'reaction') return <ReactionGame onBack={() => setActiveGame(null)} />
  if (activeGame === 'memory') return <MemoryGame onBack={() => setActiveGame(null)} />
  if (activeGame === 'stroop') return <StroopGame onBack={() => setActiveGame(null)} />

  return (
    <div className="mg-page">
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

      <div className="mg-grid">
        {games.map(g => (
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
    </div>
  )
}

export default MiniGames
