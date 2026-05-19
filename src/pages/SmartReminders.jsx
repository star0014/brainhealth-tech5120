import { useState, useEffect } from 'react'
import { useAuth, SignUpButton } from '@clerk/clerk-react'
import './SmartReminders.css'

const API = import.meta.env.VITE_API_URL || 'https://brainhealth-iteration2-production.up.railway.app/api'
const LS_HABITS_KEY = 'bb_guest_habits'
export const LS_PREFS_KEY = 'bb_reminder_prefs'

const isGuest = () => localStorage.getItem('bb_is_guest') === 'true'

const DEFAULT_PREFS = {
  enabled: true,
  window: 'Evening',
  tone: 'Chill',
  studyCrunchMode: false,
  studyCrunchStart: '',
  studyCrunchEnd: '',
}

export function loadReminderPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(LS_PREFS_KEY) || '{}') } }
  catch { return { ...DEFAULT_PREFS } }
}

function savePrefs(prefs) {
  localStorage.setItem(LS_PREFS_KEY, JSON.stringify(prefs))
}

export const sleepToNum = s => {
  if (!s) return null
  if (s === '< 6') return 5.5
  if (s === '9+' || s === '10+') return 10.5
  return parseFloat(s)
}

export function getSleepBand(sleepHours) {
  const n = sleepToNum(sleepHours)
  if (n === null) return null
  if (n < 6) return 'red'
  if (n < 7) return 'yellow'
  if (n <= 9) return 'green'
  return 'blue'
}

const HIGH_SCREEN = ['6-8h', '8h+']

export function analyzeScreenPattern(habits) {
  const recent = habits.slice(0, 7)
  const highDays = recent.filter(h => HIGH_SCREEN.includes(h.screen_time)).length
  return highDays >= 3
}

export function isStudyCrunchActive(prefs) {
  if (!prefs.studyCrunchMode || !prefs.studyCrunchStart || !prefs.studyCrunchEnd) return false
  const today = new Date().toLocaleDateString('en-CA')
  return today >= prefs.studyCrunchStart && today <= prefs.studyCrunchEnd
}

export const REMINDER_MESSAGES = {
  Chill: {
    red:         "Hey, looks like you only got {sleep} hrs last night 😴 No pressure, but maybe try winding down a bit earlier tonight?",
    yellow:      "Just noticed you logged {sleep} hrs of sleep — pretty close! Even 30 extra mins can help 🌙",
    green:       "Nice one! {sleep} hrs is solid sleep. Your brain thanks you 🧠✨",
    blue:        "Whoa, that's a lot of sleep! Sometimes quality > quantity — see how you feel today 💙",
    screenHigh:  "You've had heavy screen time a few evenings this week. Maybe try a quick wind-down before bed tonight? 🌿",
    studyCrunch: "Study Crunch Mode is on — remember to take breaks and protect your sleep tonight! 📚💤",
    healthy:     "Your habits look great this week! Keep up the good work 🌟",
    noData:      "Log your first check-in to get personalised reminders! 📊",
  },
  Direct: {
    red:         "Warning: {sleep} hrs of sleep is below the healthy minimum. Aim for 7–8 hrs tonight.",
    yellow:      "You logged {sleep} hrs. Close to target — try to reach 7–8 hrs for optimal brain function.",
    green:       "{sleep} hrs logged. On target. Maintain this pattern.",
    blue:        "You logged {sleep}+ hrs. While rest matters, 7–9 hrs is optimal. Monitor alertness today.",
    screenHigh:  "Heavy screen use detected 3+ evenings this week. Reduce screen time before bed to protect sleep quality.",
    studyCrunch: "Study Crunch Mode active. Priorities: sleep consistency, movement breaks, screen cutoff 1 hr before bed.",
    healthy:     "Current habits are within healthy ranges. Continue your routine.",
    noData:      "No check-in data found. Log your habits to receive personalised reminders.",
  },
  Hype: {
    red:         "Oof, {sleep} hrs?! Your brain is CRAVING more rest — let's fix that tonight! 🔥",
    yellow:      "{sleep} hrs is SO close! One more hour and you'll be in the ZONE 💪",
    green:       "{sleep} HOURS?! LET'S GO! Your brain is fully charged and READY TO CRUSH IT! 🚀🧠",
    blue:        "All that sleep?! Rest champion status UNLOCKED! Channel that energy today ⚡",
    screenHigh:  "Screen time monster alert! 📱🚨 Let's swap screens for a chill wind-down tonight — future you will THANK YOU!",
    studyCrunch: "STUDY CRUNCH MODE ACTIVATED! 🎯 You've GOT this — just don't forget to sleep, hydrate, and MOVE!",
    healthy:     "YOUR HABITS ARE ON FIRE! 🔥 Keep smashing it — you're literally building a better brain every day!",
    noData:      "Let's get that first check-in logged! Your reminder journey starts NOW! 🚀",
  },
}

function generateReminderPreview(habits, prefs) {
  if (!prefs.enabled) {
    return { type: 'disabled', msg: "Reminders are currently turned off.", color: '#94a3b8', icon: '🔕' }
  }
  const msgs = REMINDER_MESSAGES[prefs.tone] || REMINDER_MESSAGES.Chill

  if (isStudyCrunchActive(prefs)) {
    return { type: 'study', msg: msgs.studyCrunch, color: '#7c3aed', icon: '📚' }
  }

  const latest = habits[0]
  if (!latest) {
    return { type: 'info', msg: msgs.noData, color: '#64748b', icon: '📊' }
  }

  const hasHighScreen = analyzeScreenPattern(habits)
  const band = getSleepBand(latest.sleep_hours)

  if (band === 'red') {
    const label = latest.sleep_hours === '< 6' ? 'under 6' : latest.sleep_hours
    return { type: 'warning', msg: msgs.red.replace('{sleep}', label), color: '#ef4444', icon: '😴' }
  }
  if (band === 'yellow') {
    return { type: 'caution', msg: msgs.yellow.replace('{sleep}', latest.sleep_hours), color: '#f59e0b', icon: '🌙' }
  }
  if (band === 'green' && hasHighScreen) {
    return { type: 'screen', msg: msgs.screenHigh, color: '#f59e0b', icon: '📱' }
  }
  if (band === 'green') {
    return { type: 'success', msg: msgs.healthy, color: '#16a34a', icon: '✅' }
  }
  if (band === 'blue') {
    return { type: 'info', msg: msgs.blue.replace('{sleep}', '10'), color: '#0ea5e9', icon: '💙' }
  }
  return { type: 'info', msg: msgs.healthy, color: '#16a34a', icon: '✅' }
}

function SmartReminders() {
  const { getToken } = useAuth()
  const guest = isGuest()

  const [habits,     setHabits]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [prefs,      setPrefs]      = useState(loadReminderPrefs)
  const [autoSaved,  setAutoSaved]  = useState(false)

  const today = new Date().toLocaleDateString('en-CA')

  // Auto-save whenever prefs change — no manual save button needed
  useEffect(() => {
    savePrefs(prefs)
    setAutoSaved(true)
    const t = setTimeout(() => setAutoSaved(false), 1800)
    return () => clearTimeout(t)
  }, [prefs])

  useEffect(() => { loadHabits() }, [])

  async function loadHabits() {
    if (guest) {
      try { setHabits(JSON.parse(localStorage.getItem(LS_HABITS_KEY) || '[]')) } catch { setHabits([]) }
      setLoading(false)
      return
    }
    try {
      const token = await getToken()
      const res   = await fetch(`${API}/habits`, { headers: { Authorization: `Bearer ${token}` } })
      const data  = await res.json()
      setHabits(Array.isArray(data) ? data : [])
    } catch { setHabits([]) }
    finally { setLoading(false) }
  }

  const update = patch => setPrefs(p => ({ ...p, ...patch }))

  const preview              = generateReminderPreview(habits, prefs)
  const studyCrunchNowActive = isStudyCrunchActive(prefs)
  const recentHabits         = habits.slice(0, 7)
  const hasHighScreen        = analyzeScreenPattern(habits)
  const avgSleepNum          = recentHabits.length > 0
    ? recentHabits.reduce((s, h) => s + (sleepToNum(h.sleep_hours) || 0), 0) / recentHabits.length
    : null

  const crunchScheduled = prefs.studyCrunchMode && !studyCrunchNowActive
    && prefs.studyCrunchStart && prefs.studyCrunchEnd

  return (
    <div className="sr-page">

      {/* Guest nudge */}
      {guest && (
        <div className="sr-guest-banner">
          <span>You're in guest mode — preferences are saved on this device only.</span>
          <SignUpButton mode="modal">
            <button className="sr-guest-cta">Sign up free to sync across devices →</button>
          </SignUpButton>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="sr-hero">
        <div className="sr-hero-text">
          <h1>🔔 Smart Reminders</h1>
          <p>Personalised nudges based on your sleep, screen time, and study habits — so you build better routines without feeling overwhelmed.</p>
        </div>
        <div className="sr-hero-steps">
          <div className="sr-step"><span className="sr-step-num">1</span><span>Log your daily habits in Habit Tracker</span></div>
          <div className="sr-step"><span className="sr-step-num">2</span><span>BrainBoost detects patterns automatically</span></div>
          <div className="sr-step"><span className="sr-step-num">3</span><span>Receive a friendly nudge after each check-in</span></div>
        </div>
      </div>

      {/* ── Auto-saved pill ── */}
      <div className={`sr-autosave ${autoSaved ? 'visible' : ''}`}>✓ Settings saved</div>

      <div className="sr-columns">

        {/* ══ LEFT COLUMN: Reminder Settings + Study Crunch ══ */}
        <div className="sr-left-col">

          {/* Master toggle card */}
          <div className="sr-card">
            <div className="sr-master-toggle-row">
              <div className="sr-master-toggle-text">
                <h2>Reminders</h2>
                <p>{prefs.enabled ? 'Nudges appear after each habit check-in' : 'No nudges will be shown'}</p>
              </div>
              <button
                className={`sr-toggle ${prefs.enabled ? 'on' : 'off'}`}
                onClick={() => update({ enabled: !prefs.enabled })}
                aria-label="Toggle reminders"
              >
                <span className="sr-toggle-knob" />
              </button>
            </div>
          </div>

          {/* Settings card — tone + window */}
          <div className={`sr-card ${!prefs.enabled ? 'sr-card-dimmed' : ''}`}>
            <h2>Personalise Your Nudges</h2>

            {/* Tone */}
            <div className="sr-field">
              <label>Reminder Tone</label>
              <p className="sr-field-desc">Choose how BrainBoost speaks to you.</p>
              <div className="sr-tone-grid">
                {[
                  { key: 'Chill',  icon: '😌', title: 'Chill',  desc: 'Friendly & low-pressure' },
                  { key: 'Direct', icon: '🎯', title: 'Direct', desc: 'Clear & to the point' },
                  { key: 'Hype',   icon: '🔥', title: 'Hype',   desc: 'Energetic & motivating' },
                ].map(({ key, icon, title, desc }) => (
                  <button
                    key={key}
                    disabled={!prefs.enabled}
                    className={`sr-tone-card ${prefs.tone === key ? 'selected' : ''}`}
                    onClick={() => update({ tone: key })}
                  >
                    <span className="sr-tone-icon">{icon}</span>
                    <span className="sr-tone-title">{title}</span>
                    <span className="sr-tone-desc">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Window */}
            <div className="sr-field" style={{ marginBottom: 0 }}>
              <label>Reminder Window</label>
              <p className="sr-field-desc">When would you prefer to be reminded?</p>
              <div className="sr-window-grid">
                {[
                  { key: 'Morning',   icon: '🌅', label: 'Morning',   time: '6–9 AM'  },
                  { key: 'Afternoon', icon: '☀️', label: 'Afternoon', time: '12–3 PM' },
                  { key: 'Evening',   icon: '🌙', label: 'Evening',   time: '6–9 PM'  },
                ].map(({ key, icon, label, time }) => (
                  <button
                    key={key}
                    disabled={!prefs.enabled}
                    className={`sr-window-btn ${prefs.window === key ? 'selected' : ''}`}
                    onClick={() => update({ window: key })}
                  >
                    <span>{icon} {label}</span>
                    <span className="sr-window-time">{time}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Study Crunch Mode card */}
          <div className={`sr-card sr-crunch-card ${studyCrunchNowActive ? 'sr-crunch-active' : ''}`}>
            <div className="sr-crunch-header">
              <div>
                <h2>📚 Study Crunch Mode</h2>
                <p className="sr-card-desc">During exams or assignment-heavy weeks, BrainBoost switches to study-focused reminders — sleep consistency, movement breaks, and screen fatigue tips.</p>
              </div>
              {studyCrunchNowActive && <span className="sr-badge active">ACTIVE</span>}
            </div>

            <div className="sr-field-row" style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 15, fontWeight: 600, color: '#0d1b2a' }}>Enable Study Crunch Mode</label>
              <button
                className={`sr-toggle ${prefs.studyCrunchMode ? 'on' : 'off'}`}
                onClick={() => update({ studyCrunchMode: !prefs.studyCrunchMode })}
                aria-label="Toggle Study Crunch Mode"
              >
                <span className="sr-toggle-knob" />
              </button>
            </div>

            {prefs.studyCrunchMode && (
              <>
                <p className="sr-crunch-date-label">Set your study period:</p>
                <div className="sr-date-range">
                  <div className="sr-date-field">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={prefs.studyCrunchStart}
                      onChange={e => update({ studyCrunchStart: e.target.value })}
                      className="sr-date-input"
                    />
                  </div>
                  <div className="sr-date-field">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={prefs.studyCrunchEnd}
                      min={prefs.studyCrunchStart || today}
                      onChange={e => update({ studyCrunchEnd: e.target.value })}
                      className="sr-date-input"
                    />
                  </div>
                </div>
              </>
            )}

            {studyCrunchNowActive && (
              <div className="sr-crunch-active-notice">
                <strong>📚 Study mode is active</strong>
                <span>Until {new Date(prefs.studyCrunchEnd + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} — all reminders are study-focused. You've got this! 💪</span>
              </div>
            )}

            {crunchScheduled && (
              <div className="sr-crunch-scheduled-notice">
                🗓 Scheduled: {new Date(prefs.studyCrunchStart + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} → {new Date(prefs.studyCrunchEnd + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </div>
            )}

            {prefs.studyCrunchMode && !prefs.studyCrunchStart && (
              <p className="sr-crunch-hint">👆 Pick a start and end date above to activate.</p>
            )}
          </div>

        </div>

        {/* ══ RIGHT COLUMN: Live Preview + Analysis ══ */}
        <div className="sr-right-col">

          {/* Live preview card */}
          <div className="sr-card sr-preview-card">
            <h2>Live Preview</h2>
            <p className="sr-card-desc">This is the reminder you'd receive right now based on your current settings and habit data.</p>

            {loading ? (
              <div className="sr-loading">Analysing your habits...</div>
            ) : (
              <div className="sr-preview-box" style={{ borderColor: preview.color, background: preview.color + '12' }}>
                <span className="sr-preview-icon">{preview.icon}</span>
                <p className="sr-preview-msg">{preview.msg}</p>
              </div>
            )}
          </div>

          {/* Habit analysis card */}
          <div className="sr-card">
            <h2>Habit Analysis</h2>
            <p className="sr-card-desc">Your patterns over the last 7 days.</p>

            {loading ? (
              <div className="sr-loading">Loading...</div>
            ) : (
              <div className="sr-analysis-list">
                <div className="sr-analysis-row">
                  <div className="sr-analysis-left">
                    <span className="sr-analysis-icon">💤</span>
                    <div>
                      <div className="sr-analysis-label">Avg Sleep</div>
                      <div className="sr-analysis-value">
                        {avgSleepNum !== null ? `${avgSleepNum.toFixed(1)} hrs` : 'No data'}
                      </div>
                    </div>
                  </div>
                  <span className={`sr-pill ${
                    avgSleepNum !== null
                      ? avgSleepNum >= 7 && avgSleepNum <= 9 ? 'good' : 'warn'
                      : 'neutral'
                  }`}>
                    {avgSleepNum !== null
                      ? avgSleepNum >= 7 && avgSleepNum <= 9 ? 'On target' : avgSleepNum < 7 ? 'Below target' : 'Above avg'
                      : 'No data'}
                  </span>
                </div>

                <div className="sr-analysis-row">
                  <div className="sr-analysis-left">
                    <span className="sr-analysis-icon">📱</span>
                    <div>
                      <div className="sr-analysis-label">High Screen Days</div>
                      <div className="sr-analysis-value">
                        {habits.length > 0
                          ? `${recentHabits.filter(h => HIGH_SCREEN.includes(h.screen_time)).length} of 7 days`
                          : 'No data'}
                      </div>
                    </div>
                  </div>
                  <span className={`sr-pill ${hasHighScreen ? 'warn' : habits.length > 0 ? 'good' : 'neutral'}`}>
                    {habits.length > 0
                      ? hasHighScreen ? 'High usage' : 'Manageable'
                      : 'No data'}
                  </span>
                </div>

                <div className="sr-analysis-row">
                  <div className="sr-analysis-left">
                    <span className="sr-analysis-icon">📚</span>
                    <div>
                      <div className="sr-analysis-label">Study Crunch Mode</div>
                      <div className="sr-analysis-value">
                        {studyCrunchNowActive ? 'Active' : crunchScheduled ? 'Scheduled' : 'Off'}
                      </div>
                    </div>
                  </div>
                  <span className={`sr-pill ${studyCrunchNowActive ? 'study' : 'neutral'}`}>
                    {studyCrunchNowActive ? 'Study mode' : 'Standard'}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// Exported constant for the HIGH_SCREEN check used in HabitTracker
export { HIGH_SCREEN }

export default SmartReminders
