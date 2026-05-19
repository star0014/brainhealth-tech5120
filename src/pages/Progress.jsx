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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer } from 'recharts'
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

// ── Game achievements ────────────────────────────────────────────────────────
// Each achievement has an id, emoji, Gen Z label, desc, rarity tier, and a
// condition function that receives the full gameScores array and returns boolean.
// Rarity: 'common' | 'rare' | 'legendary'

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

      // Fetch guest game scores using X-Guest-ID header
      const guestId = localStorage.getItem('bb_guest_id')
      if (guestId) {
        try {
          const gamesRes = await fetch(`${API}/games`, { headers: { 'X-Guest-ID': guestId } })
          const gamesData = await gamesRes.json()
          if (Array.isArray(gamesData)) setGameScores(gamesData)
        } catch { /* silently fail */ }
      }

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
  const unlockedMilestones    = MILESTONES.filter(m => total >= m.days)
  const nextMilestone         = MILESTONES.find(m => total < m.days)
  const progressToNext        = nextMilestone ? (total / nextMilestone.days) * 100 : 100  // 100% if all milestones are unlocked

  const reactionData    = gameScores.filter(g => g.game_id === 'reaction').slice(0, 8).reverse().map((g, i) => ({ n: `#${i + 1}`, ms: g.score }))
  const memoryData      = gameScores.filter(g => g.game_id === 'memory').slice(0, 8).reverse().map((g, i) => ({ n: `#${i + 1}`, moves: g.score }))
  const stroopData      = gameScores.filter(g => g.game_id === 'stroop').slice(0, 8).reverse().map((g, i) => ({ n: `#${i + 1}`, acc: g.score }))
  const patternData     = gameScores.filter(g => g.game_id === 'visual_pattern').slice(0, 8).reverse().map((g, i) => ({ n: `#${i + 1}`, level: g.score }))
  const mathData        = gameScores.filter(g => g.game_id === 'mental_math').slice(0, 8).reverse().map((g, i) => ({ n: `#${i + 1}`, score: g.score }))

  // Personal bests per game (reaction/memory: lower = better; stroop/pattern/math: higher = better).
  const pbReaction = reactionData.length > 0 ? Math.min(...reactionData.map(d => d.ms))      : null
  const pbMemory   = memoryData.length   > 0 ? Math.min(...memoryData.map(d => d.moves))     : null
  const pbStroop   = stroopData.length   > 0 ? Math.max(...stroopData.map(d => d.acc))       : null
  const pbPattern  = patternData.length  > 0 ? Math.max(...patternData.map(d => d.level))    : null
  const pbMath     = mathData.length     > 0 ? Math.max(...mathData.map(d => d.score))       : null

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
        <div className="progress-hero-visual">
          <img
            src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300&q=80"
            alt="Progress"
            className="hero-illustration"
          />
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

      {/* ── Game performance charts ──────────────────────────────────────────── */}
      <div className="game-charts-section">
        <h2>Game Performance</h2>
        <div className="game-charts-grid">

          {/* ── Reaction Test ── */}
          <div className="game-chart-card reaction">
            <div className="game-chart-header">
              <div>
                <div className="game-chart-title">⚡ Reaction Test</div>
                <div className="game-chart-skill">Processing Speed · lower = better</div>
              </div>
              {pbReaction !== null && (
                <div className="game-chart-pb reaction">
                  <div className="game-chart-pb-num">{pbReaction}ms</div>
                  <div className="game-chart-pb-label">personal best</div>
                </div>
              )}
            </div>
            {reactionData.length === 0 ? (
              <div className="game-chart-empty">No plays yet — give it a try!</div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={reactionData} margin={{ top: 8, right: 24, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="n" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip formatter={v => [`${v}ms`, 'Reaction time']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <ReferenceLine y={300} stroke="#cbd5e1" strokeDasharray="4 3" label={{ value: '300ms', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
                  <Line type="monotone" dataKey="ms" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Memory Match ── */}
          <div className="game-chart-card memory">
            <div className="game-chart-header">
              <div>
                <div className="game-chart-title">🧠 Memory Match</div>
                <div className="game-chart-skill">Working Memory · fewer moves = better</div>
              </div>
              {pbMemory !== null && (
                <div className="game-chart-pb memory">
                  <div className="game-chart-pb-num">{pbMemory}</div>
                  <div className="game-chart-pb-label">best moves</div>
                </div>
              )}
            </div>
            {memoryData.length === 0 ? (
              <div className="game-chart-empty">No plays yet — give it a try!</div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={memoryData} margin={{ top: 8, right: 24, bottom: 0, left: -20 }} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="n" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`${v} moves`, 'Moves']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <ReferenceLine y={20} stroke="#cbd5e1" strokeDasharray="4 3" label={{ value: 'target', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
                  <Bar dataKey="moves" radius={[6, 6, 0, 0]}>
                    {memoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.moves <= 16 ? '#16a34a' : entry.moves <= 20 ? '#7c3aed' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Stroop Test ── */}
          <div className="game-chart-card stroop">
            <div className="game-chart-header">
              <div>
                <div className="game-chart-title">🌈 Stroop Test</div>
                <div className="game-chart-skill">Attention Control · higher = better</div>
              </div>
              {pbStroop !== null && (
                <div className="game-chart-pb stroop">
                  <div className="game-chart-pb-num">{pbStroop}%</div>
                  <div className="game-chart-pb-label">personal best</div>
                </div>
              )}
            </div>
            {stroopData.length === 0 ? (
              <div className="game-chart-empty">No plays yet — give it a try!</div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={stroopData} margin={{ top: 8, right: 24, bottom: 0, left: -20 }} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="n" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip formatter={v => [`${v}%`, 'Accuracy']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <ReferenceLine y={80} stroke="#cbd5e1" strokeDasharray="4 3" label={{ value: '80%', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
                  <Bar dataKey="acc" radius={[6, 6, 0, 0]}>
                    {stroopData.map((entry, i) => (
                      <Cell key={i} fill={entry.acc >= 80 ? '#16a34a' : entry.acc >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Visual Pattern ── */}
          <div className="game-chart-card" style={{ borderTopColor: '#0891b2' }}>
            <div className="game-chart-header">
              <div>
                <div className="game-chart-title">🔲 Visual Pattern</div>
                <div className="game-chart-skill">Working Memory · higher level = better</div>
              </div>
              {pbPattern !== null && (
                <div className="game-chart-pb" style={{ background: '#e0f9ff', borderColor: '#0891b240' }}>
                  <div className="game-chart-pb-num" style={{ color: '#0891b2' }}>Lvl {pbPattern}</div>
                  <div className="game-chart-pb-label">personal best</div>
                </div>
              )}
            </div>
            {patternData.length === 0 ? (
              <div className="game-chart-empty">No plays yet — give it a try!</div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={patternData} margin={{ top: 8, right: 24, bottom: 0, left: -20 }} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="n" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`Level ${v}`, 'Level reached']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <ReferenceLine y={6} stroke="#cbd5e1" strokeDasharray="4 3" label={{ value: 'target', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
                  <Bar dataKey="level" radius={[6, 6, 0, 0]}>
                    {patternData.map((entry, i) => (
                      <Cell key={i} fill={entry.level >= 9 ? '#16a34a' : entry.level >= 6 ? '#0891b2' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Mental Math ── */}
          <div className="game-chart-card" style={{ borderTopColor: '#16a34a' }}>
            <div className="game-chart-header">
              <div>
                <div className="game-chart-title">🔢 Mental Math</div>
                <div className="game-chart-skill">Executive Function · higher score = better</div>
              </div>
              {pbMath !== null && (
                <div className="game-chart-pb" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <div className="game-chart-pb-num" style={{ color: '#16a34a' }}>{pbMath}</div>
                  <div className="game-chart-pb-label">personal best</div>
                </div>
              )}
            </div>
            {mathData.length === 0 ? (
              <div className="game-chart-empty">No plays yet — give it a try!</div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={mathData} margin={{ top: 8, right: 24, bottom: 0, left: -20 }} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="n" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`${v} correct`, 'Score']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <ReferenceLine y={18} stroke="#cbd5e1" strokeDasharray="4 3" label={{ value: 'target', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {mathData.map((entry, i) => (
                      <Cell key={i} fill={entry.score >= 25 ? '#16a34a' : entry.score >= 18 ? '#2563eb' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      </div>

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
                {/* If date is already a full ISO timestamp (authenticated), use it directly.
                    If it's a plain YYYY-MM-DD string (guest), append T12:00:00 to avoid timezone off-by-one. */}
                <div className="recent-date">
                  {new Date(h.date.includes('T') ? h.date : h.date + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
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
