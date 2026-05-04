import { useState, useEffect } from 'react'
import { useAuth, SignUpButton } from '@clerk/clerk-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './HabitTracker.css'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'
const LS_KEY = 'bb_guest_habits'

const isGuest = () => localStorage.getItem('bb_is_guest') === 'true'

// ── localStorage helpers ────────────────────────────────────────────────────
function guestLoadHabits() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}

function guestSaveHabit(entry) {
  const habits = guestLoadHabits()
  const idx = habits.findIndex(h => h.date === entry.date)
  if (idx >= 0) habits[idx] = { ...habits[idx], ...entry }
  else habits.unshift({ id: Date.now(), ...entry })
  localStorage.setItem(LS_KEY, JSON.stringify(habits))
  return habits
}

// ── Icons ───────────────────────────────────────────────────────────────────
const MoonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
const ScreenIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
)
const RunIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13" cy="4" r="1"/><path d="M7 21l3-7 2 2 3-5 2 4M5 14l2-4 4 2 2-4"/>
  </svg>
)

const sleepToNum = s => {
  if (!s) return null
  if (s === '< 6') return 5.5
  if (s === '9+') return 9
  return parseFloat(s)
}

function HabitTracker() {
  const { getToken } = useAuth()
  const guest = isGuest()

  const [habits, setHabits] = useState([])
  const [todayCheckin, setTodayCheckin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('checkin')
  const [historyRange, setHistoryRange] = useState(7)
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState({ sleep_hours: '', screen_time: '', physical_activity: false })

  const today = new Date().toLocaleDateString('en-CA')

  useEffect(() => { loadHabits() }, [])

  // ── Load ──────────────────────────────────────────────────────────────────
  async function loadHabits() {
    if (guest) {
      const data = guestLoadHabits()
      setHabits(data)
      const todayData = data.find(h => h.date === today)
      if (todayData) {
        setTodayCheckin(todayData)
        setForm({ sleep_hours: todayData.sleep_hours, screen_time: todayData.screen_time, physical_activity: todayData.physical_activity })
      }
      setLoading(false)
      return
    }
    try {
      const token = await getToken()
      const res = await fetch(`${API}/habits`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!Array.isArray(data)) { setLoading(false); return }
      setHabits(data)
      const todayData = data.find(h => h.date && new Date(h.date).toLocaleDateString('en-CA') === today)
      if (todayData) {
        setTodayCheckin(todayData)
        setForm({ sleep_hours: todayData.sleep_hours, screen_time: todayData.screen_time, physical_activity: todayData.physical_activity })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.sleep_hours || !form.screen_time) return
    setSaving(true)
    try {
      if (guest) {
        const updated = guestSaveHabit({ ...form, date: today })
        setHabits(updated)
        const saved = updated.find(h => h.date === today)
        setTodayCheckin(saved)
        setSuccessMsg(todayCheckin ? 'Check-in updated!' : 'Check-in saved!')
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        const token = await getToken()
        const method = todayCheckin ? 'PUT' : 'POST'
        const url = todayCheckin ? `${API}/habits/${today}` : `${API}/habits`
        const res = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, date: today })
        })
        if (res.ok) {
          setSuccessMsg(todayCheckin ? 'Check-in updated!' : 'Check-in saved!')
          setTimeout(() => setSuccessMsg(''), 3000)
          loadHabits()
        }
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const filteredHabits = habits.slice(0, historyRange)

  const chartData = (() => {
    const result = []
    for (let i = historyRange - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-CA')
      const habit = habits.find(h => {
        const hDate = guest ? h.date : new Date(h.date).toLocaleDateString('en-CA')
        return hDate === dateStr
      })
      result.push({
        date: d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' }),
        sleep: habit ? sleepToNum(habit.sleep_hours) : null,
        active: habit ? (habit.physical_activity ? 1 : 0.15) : null,
        hasData: !!habit,
        wasActive: habit ? habit.physical_activity : false
      })
    }
    return result
  })()

  const avgSleep = filteredHabits.length > 0
    ? (filteredHabits.reduce((sum, h) => sum + (sleepToNum(h.sleep_hours) || 0), 0) / filteredHabits.length).toFixed(1)
    : null
  const activeDays = filteredHabits.filter(h => h.physical_activity).length

  if (loading) return (
    <div className="ht-loading">
      <div className="ht-loading-spinner" />
      <p>Loading your habits...</p>
    </div>
  )

  return (
    <div className="ht-page">

      {/* Guest nudge banner */}
      {guest && (
        <div className="ht-guest-banner">
          <span>You're in guest mode — your data is saved on this device only.</span>
          <SignUpButton mode="modal">
            <button className="ht-guest-cta">Sign up free to sync across devices →</button>
          </SignUpButton>
        </div>
      )}

      <div className="ht-hero">
        <div className="ht-hero-text">
          <h1>Habit Tracker</h1>
          <p>Small daily habits lead to big changes in brain health.</p>
        </div>
        <div className="ht-hero-visual">
          <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" width="200" height="160">
            <circle cx="100" cy="80" r="60" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
            <path d="M70,80 C70,65 80,55 95,55 C100,45 110,42 118,48 C126,42 136,45 138,55 C148,58 152,68 148,78 C152,85 150,95 142,98 C140,108 130,112 122,108 C116,114 106,114 100,108 C94,114 84,112 80,106 C72,104 68,94 72,86 C68,83 68,80 70,80Z" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
            <line x1="100" y1="55" x2="100" y2="108" stroke="#93c5fd" strokeWidth="1" strokeDasharray="3,2"/>
            <circle cx="100" cy="65" r="3" fill="#2563eb"><animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/></circle>
            <circle cx="85" cy="85" r="2.5" fill="#3b82f6"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite"/></circle>
            <circle cx="115" cy="85" r="2.5" fill="#3b82f6"><animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/></circle>
          </svg>
        </div>
      </div>

      <div className="ht-tabs">
        <button className={`ht-tab ${view === 'checkin' ? 'active' : ''}`} onClick={() => setView('checkin')}>Today's Check-in</button>
        <button className={`ht-tab ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>History & Charts</button>
      </div>

      {view === 'checkin' && (
        <div className="ht-checkin">
          {todayCheckin && (
            <div className="ht-already-done">You've already checked in today — update your entry below if needed.</div>
          )}
          <div className="ht-card">
            <div className="ht-field">
              <label><MoonIcon /> Sleep Hours</label>
              <p className="ht-field-desc">How many hours did you sleep last night?</p>
              <div className="ht-options">
                {['< 6', '6', '7', '8', '9+'].map(val => (
                  <button key={val} className={`ht-option ${form.sleep_hours === val ? 'selected' : ''}`} onClick={() => setForm({ ...form, sleep_hours: val })}>{val} hrs</button>
                ))}
              </div>
            </div>
            <div className="ht-field">
              <label><ScreenIcon /> Screen Time</label>
              <p className="ht-field-desc">How much recreational screen time did you have today?</p>
              <div className="ht-options">
                {['< 2h', '2-4h', '4-6h', '6-8h', '8h+'].map(val => (
                  <button key={val} className={`ht-option ${form.screen_time === val ? 'selected' : ''}`} onClick={() => setForm({ ...form, screen_time: val })}>{val}</button>
                ))}
              </div>
            </div>
            <div className="ht-field">
              <label><RunIcon /> Physical Activity</label>
              <p className="ht-field-desc">Did you do any physical activity today?</p>
              <div className="ht-activity-toggle">
                <button className={`ht-toggle-btn ${form.physical_activity ? 'active' : ''}`} onClick={() => setForm({ ...form, physical_activity: true })}>Yes, I was active</button>
                <button className={`ht-toggle-btn ${!form.physical_activity ? 'active' : ''}`} onClick={() => setForm({ ...form, physical_activity: false })}>No activity today</button>
              </div>
            </div>
            {successMsg && <div className="ht-success">{successMsg}</div>}
            <button className="ht-submit" onClick={handleSubmit} disabled={saving || !form.sleep_hours || !form.screen_time}>
              {saving ? 'Saving...' : todayCheckin ? 'Update Check-in' : 'Save Check-in'}
            </button>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="ht-history">
          <div className="ht-range-toggle">
            <button className={historyRange === 7 ? 'active' : ''} onClick={() => setHistoryRange(7)}>7 Days</button>
            <button className={historyRange === 30 ? 'active' : ''} onClick={() => setHistoryRange(30)}>30 Days</button>
          </div>

          <div className="ht-summary-cards">
            <div className="ht-summary-card">
              <div className="ht-summary-num">{avgSleep ?? '—'}</div>
              <div className="ht-summary-label">Avg Sleep (hrs)</div>
            </div>
            <div className="ht-summary-card">
              <div className="ht-summary-num">{activeDays}</div>
              <div className="ht-summary-label">Active Days</div>
            </div>
            <div className="ht-summary-card">
              <div className="ht-summary-num">{filteredHabits.length}</div>
              <div className="ht-summary-label">Check-ins</div>
            </div>
          </div>

          {filteredHabits.length > 0 && (
            <>
              <div className="ht-chart-card">
                <h3>Sleep Hours</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} barSize={historyRange === 7 ? 28 : 12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="date" tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0, 10]} tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} width={24}/>
                    <Tooltip formatter={(v) => v ? [`${v} hrs`, 'Sleep'] : ['No data', 'Sleep']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}/>
                    <Bar dataKey="sleep" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.hasData ? '#2563eb' : '#bfdbfe'} fillOpacity={entry.hasData ? 1 : 0.7}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="ht-chart-card">
                <h3>Physical Activity</h3>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData} barSize={historyRange === 7 ? 28 : 12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="date" tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={(v, n, p) => p.payload.hasData ? [p.payload.wasActive ? 'Active' : 'Rest day', 'Activity'] : ['No data', 'Activity']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}/>
                    <Bar dataKey="active" radius={[6, 6, 0, 0]} minPointSize={4}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={!entry.hasData ? '#bfdbfe' : entry.wasActive ? '#16a34a' : '#fca5a5'} fillOpacity={entry.hasData ? 1 : 0.5}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="ht-chart-legend">
                  <span><span className="legend-dot" style={{background:'#16a34a'}}/> Active</span>
                  <span><span className="legend-dot" style={{background:'#fca5a5'}}/> Rest day</span>
                  <span><span className="legend-dot" style={{background:'#bfdbfe'}}/> No data</span>
                </div>
              </div>
            </>
          )}

          {filteredHabits.length === 0 ? (
            <div className="ht-empty">No check-ins yet. Start tracking today!</div>
          ) : (
            <div className="ht-history-list">
              <h3>Daily Log</h3>
              {filteredHabits.map(h => (
                <div key={h.id} className="ht-history-card">
                  <div className="ht-history-date">
                    {new Date(h.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="ht-history-stats">
                    <div className="ht-stat">
                      <span className="ht-stat-value">{h.sleep_hours} hrs sleep</span>
                    </div>
                    <div className="ht-stat">
                      <span className="ht-stat-value">{h.screen_time} screen</span>
                    </div>
                    <div className="ht-stat">
                      <span className={`ht-stat-value ${h.physical_activity ? 'active' : 'inactive'}`}>
                        {h.physical_activity ? 'Active' : 'Rest day'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default HabitTracker
