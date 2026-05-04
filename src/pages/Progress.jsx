// ─────────────────────────────────────────────────────────────────────────────
// Progress page — displays the user's check-in streak, lifetime totals,
// milestone achievements, game history, and a recent activity log.
//
// Data sources:
//   Authenticated users: fetches from /api/habits/streak, /api/habits, /api/games.
//   Guest users:         reads entirely from localStorage (bb_guest_habits key).
//
// Milestone logic:
//   When the page loads, it compares the new total check-in count against the
//   previously stored count (bb_total_checkins in localStorage). Any milestones
//   that fall between the old and new totals are considered "just unlocked" and
//   shown via the MilestoneBanner component.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useAuth, SignUpButton } from '@clerk/clerk-react'
import './Progress.css'
import MilestoneBanner from '../components/MilestoneBanner'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'

// ── Guest localStorage helpers ──────────────────────────────────────────────
// These functions replace API calls for guest users.
const isGuest = () => localStorage.getItem('bb_is_guest') === 'true'
const LS_KEY = 'bb_guest_habits'

// Safely parses the stored habits JSON; returns an empty array on error.
function guestLoadHabits() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}

// Calculates the current consecutive-day streak from an array of habit objects.
// Mirrors the streak algorithm in server/routes/habits.js but runs client-side for guests.
// sorted descending so we can walk backwards from the most recent entry.
function guestComputeStreak(habits) {
  if (!habits.length) return 0
  const sorted = [...habits].sort((a, b) => new Date(b.date) - new Date(a.date))
  const today = new Date().toLocaleDateString('en-CA')
  let streak = 0
  let cursor = new Date()
  for (const h of sorted) {
    const d = new Date(h.date).toLocaleDateString('en-CA')
    const expected = cursor.toLocaleDateString('en-CA')
    // Allow streak=0 start from today, or continue if dates match expectations
    if (d === expected || (streak === 0 && d === today)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)  // advance cursor one day backward
    } else break
  }
  return streak
}

// ── Milestone definitions ───────────────────────────────────────────────────
// Four milestone thresholds. When total check-ins reaches a threshold,
// the milestone is "unlocked" and the MilestoneBanner fires.
const MILESTONES = [
  { days: 1,  label: 'First Check-in',  desc: 'You showed up — that is how it starts!', color: '#60a5fa' },
  { days: 3,  label: '3-Day Starter',   desc: 'You showed up 3 days in a row!',          color: '#3b82f6' },
  { days: 7,  label: '7-Day Streak',    desc: 'A full week of healthy habits!',           color: '#2563eb' },
  { days: 30, label: '30-Day Legend',   desc: 'A whole month — you are unstoppable!',     color: '#1d4ed8' },
]

// ── Rating helpers ──────────────────────────────────────────────────────────
// Returns a label and colour for a reaction-time score (in milliseconds).
// Lower ms = better reaction speed.
function getRatingReaction(ms) {
  if (ms < 200) return { label: 'Exceptional', color: '#16a34a' }
  if (ms < 250) return { label: 'Great', color: '#2563eb' }
  if (ms < 300) return { label: 'Good', color: '#7c3aed' }
  if (ms < 350) return { label: 'Average', color: '#d97706' }
  return { label: 'Keep Practicing', color: '#94a3b8' }
}

// Returns a label and colour for a memory-game score (number of moves).
// Fewer moves = better working memory.
function getRatingMemory(moves) {
  if (moves <= 12) return { label: 'Exceptional', color: '#16a34a' }
  if (moves <= 16) return { label: 'Great', color: '#2563eb' }
  if (moves <= 20) return { label: 'Good', color: '#7c3aed' }
  return { label: 'Keep Practicing', color: '#d97706' }
}

function Progress() {
  const { getToken } = useAuth()

  // Streak and total are shown in the stats cards at the top of the page.
  const [streak,       setStreak]       = useState(0)
  const [total,        setTotal]        = useState(0)
  const [habits,       setHabits]       = useState([])
  const [gameScores,   setGameScores]   = useState([])
  const [loading,      setLoading]      = useState(true)
  // newMilestone: the most recently unlocked milestone object (or null).
  // Passed to MilestoneBanner to trigger the celebration overlay.
  const [newMilestone, setNewMilestone] = useState(null)

  useEffect(() => { fetchData() }, [])

  // Fetches all data on mount.
  // Guest mode reads from localStorage; authenticated users make three parallel API calls.
  async function fetchData() {
    if (isGuest()) {
      const habitsData     = guestLoadHabits()
      const computedStreak = guestComputeStreak(habitsData)
      const computedTotal  = habitsData.length
      setHabits(habitsData)
      setStreak(computedStreak)
      setTotal(computedTotal)

      // Milestone detection: compare new total against the previously stored total.
      const prevTotal     = parseInt(localStorage.getItem('bb_total_checkins') || '0')
      const justUnlocked  = MILESTONES.filter(m => m.days <= computedTotal && m.days > prevTotal)
      if (justUnlocked.length > 0) setNewMilestone(justUnlocked[justUnlocked.length - 1])

      // Persist the new total so next visit can detect further unlocks.
      localStorage.setItem('bb_total_checkins', computedTotal)
      setLoading(false)
      return
    }

    // Authenticated path: fetch streak, all habits, and game scores in parallel.
    try {
      const token   = await getToken()
      const headers = { Authorization: `Bearer ${token}` }
      const [streakRes, habitsRes, gamesRes] = await Promise.all([
        fetch(`${API}/habits/streak`, { headers }),
        fetch(`${API}/habits`,        { headers }),
        fetch(`${API}/games`,         { headers })
      ])
      const streakData = await streakRes.json()
      const habitsData = await habitsRes.json()
      const gamesData  = await gamesRes.json()

      setStreak(streakData.streak || 0)
      setTotal(streakData.total  || 0)
      if (Array.isArray(habitsData)) setHabits(habitsData)

      // Milestone detection: same logic as the guest path.
      const prevTotal    = parseInt(localStorage.getItem('bb_total_checkins') || '0')
      const newTotal     = streakData.total || 0
      const justUnlocked = MILESTONES.filter(m => m.days <= newTotal && m.days > prevTotal)
      if (justUnlocked.length > 0) setNewMilestone(justUnlocked[justUnlocked.length - 1])
      localStorage.setItem('bb_total_checkins', newTotal)

      if (Array.isArray(gamesData)) setGameScores(gamesData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Derived values for the milestone progress bar.
  const unlockedMilestones = MILESTONES.filter(m => total >= m.days)
  const nextMilestone      = MILESTONES.find(m => total < m.days)
  const progressToNext     = nextMilestone ? (total / nextMilestone.days) * 100 : 100  // 100% if all milestones are unlocked

  // Show a spinner while data is loading.
  if (loading) return (
    <div className="progress-loading">
      <div className="progress-spinner" />
      <p>Loading your progress...</p>
    </div>
  )

  return (
    <div className="progress-page">
      {/* Milestone celebration banner — auto-dismisses after 5 seconds */}
      {newMilestone && <MilestoneBanner milestone={newMilestone} onClose={() => setNewMilestone(null)} />}

      {/* Guest mode notice — same style as GuestBanner but placed inline on this page */}
      {isGuest() && (
        <div className="ht-guest-banner">
          <span>You're in guest mode — your data is saved on this device only.</span>
          <SignUpButton mode="modal">
            <button className="ht-guest-cta">Sign up free to sync across devices →</button>
          </SignUpButton>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="progress-hero">
        <div className="progress-hero-text">
          <h1>Your Progress</h1>
          <p>Every check-in brings you closer to a healthier brain.</p>
        </div>
        {/* Decorative SVG with an animated pulsing circle and streak counter */}
        <div className="progress-hero-visual">
          <svg viewBox="0 0 180 140" xmlns="http://www.w3.org/2000/svg" width="180" height="140">
            <circle cx="90" cy="70" r="55" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
            <path d="M65,50 L90,30 L115,50 L125,80 L105,105 L75,105 L55,80 Z" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
            <path d="M75,65 L85,75 L105,55" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="90" cy="30" r="4" fill="#2563eb">
              <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite"/>
            </circle>
            {/* Streak count rendered as SVG text so it updates reactively */}
            <text x="90" y="125" textAnchor="middle" fontSize="11" fill="#2563eb" fontWeight="700">{streak} day streak</text>
          </svg>
        </div>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────────────────── */}
      <div className="progress-stats">
        {/* Current streak card — flame icon with current streak count */}
        <div className="progress-stat-card flame">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{streak}</div>
            <div className="stat-label">Current Streak</div>
          </div>
        </div>

        {/* Total check-ins card — calendar icon with lifetime count */}
        <div className="progress-stat-card calendar">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{total}</div>
            <div className="stat-label">Total Check-ins</div>
          </div>
        </div>

        {/* Milestones unlocked card — trophy icon with count of achieved milestones */}
        <div className="progress-stat-card trophy">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{unlockedMilestones.length}</div>
            <div className="stat-label">Milestones Unlocked</div>
          </div>
        </div>
      </div>

      {/* ── Progress bar to next milestone ───────────────────────────────────── */}
      {/* Hidden when all milestones have been unlocked */}
      {nextMilestone && (
        <div className="progress-next">
          <div className="progress-next-header">
            <span>Next milestone: <strong>{nextMilestone.label}</strong></span>
            <span>{total} / {nextMilestone.days} days</span>
          </div>
          <div className="progress-bar-bg">
            {/* Bar width is a percentage of the way to the next threshold */}
            <div className="progress-bar-fill" style={{ width: `${progressToNext}%` }} />
          </div>
          <p>{nextMilestone.days - total} more check-in{nextMilestone.days - total !== 1 ? 's' : ''} to go!</p>
        </div>
      )}

      {/* ── Milestones grid ───────────────────────────────────────────────────── */}
      <div className="milestones-section">
        <h2>Milestones</h2>
        <div className="milestones-grid">
          {MILESTONES.map(m => {
            const unlocked = total >= m.days  // true if the user has reached this threshold
            return (
              <div key={m.days} className={`milestone-card ${unlocked ? 'unlocked' : 'locked'}`}>
                {/* Icon ring: uses the milestone colour when unlocked, grey when locked */}
                <div className="milestone-icon" style={{ borderColor: unlocked ? m.color : '#e2e8f0' }}>
                  {unlocked ? (
                    // Trophy SVG — coloured with the milestone's brand colour
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                    </svg>
                  ) : (
                    // Padlock SVG — shown in grey to indicate the milestone is still locked
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </div>
                <div className="milestone-info">
                  {/* Label colour matches the milestone colour when unlocked; purple when locked */}
                  <div className="milestone-label" style={{ color: unlocked ? m.color : '#4f46e5' }}>{m.label}</div>
                  {/* Show the achievement description when unlocked; show the requirement when locked */}
                  <div className="milestone-desc">{unlocked ? m.desc : `Check in for ${m.days} days`}</div>
                </div>
                {/* "Unlocked" badge — only shown when the milestone is achieved */}
                {unlocked && <div className="milestone-badge" style={{ background: m.color }}>Unlocked</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Game history ─────────────────────────────────────────────────────── */}
      {/* Only rendered when the user has at least one saved game score */}
      {gameScores.length > 0 && (
        <div className="games-section">
          <h2>Game History</h2>
          <div className="games-list">
            {/* Show the 10 most recent scores */}
            {gameScores.slice(0, 10).map(g => {
              const isReaction = g.game_id === 'reaction'
              // Select the appropriate rating function based on which game was played
              const rating = isReaction ? getRatingReaction(g.score) : getRatingMemory(g.score)
              return (
                <div key={g.id} className="game-score-card">
                  {/* Game icon: lightning bolt for Reaction, monitor for Memory */}
                  <div className="game-score-icon" style={{ background: isReaction ? '#eff6ff' : '#f5f3ff' }}>
                    {isReaction ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <path d="M8 21h8M12 17v4"/>
                      </svg>
                    )}
                  </div>
                  <div className="game-score-info">
                    <div className="game-score-name">{isReaction ? 'Reaction Test' : 'Memory Match'}</div>
                    <div className="game-score-date">
                      {/* Format: "Mon, 5 Jan, 09:30 AM" */}
                      {new Date(g.played_at).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="game-score-result">
                    {/* Score display: append 'ms' for reaction times, 'moves' for memory */}
                    <div className="game-score-num">{g.score}{isReaction ? 'ms' : ' moves'}</div>
                    {/* Rating label coloured by performance tier */}
                    <div className="game-score-rating" style={{ color: rating.color }}>{rating.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent activity log ──────────────────────────────────────────────── */}
      {/* Shows the 7 most recent habit check-ins as a timeline of daily dots and tags */}
      {habits.length > 0 && (
        <div className="recent-section">
          <h2>Recent Activity</h2>
          <div className="recent-list">
            {habits.slice(0, 7).map(h => (
              <div key={h.id} className="recent-item">
                {/* Dot colour: green if active that day, grey if rest day */}
                <div className="recent-dot" style={{ background: h.physical_activity ? '#16a34a' : '#94a3b8' }} />
                {/* T12:00:00 is appended to avoid off-by-one day errors from timezone offsets */}
                <div className="recent-date">
                  {new Date(h.date + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="recent-tags">
                  <span className="recent-tag">{h.sleep_hours} hrs sleep</span>
                  <span className="recent-tag">{h.screen_time} screen</span>
                  {/* Activity tag: green class when active, default when rest day */}
                  <span className={`recent-tag ${h.physical_activity ? 'green' : ''}`}>
                    {h.physical_activity ? 'Active' : 'Rest day'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Progress
