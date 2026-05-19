import { useState, useEffect, useRef } from 'react'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { getOrCreateGuestId } from '../utils/guestAuth'
import './Home.css'

const DOMAINS = [
  { label: 'Sleep Rhythm', desc: 'Rest patterns shaping your daily energy.', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '🌙' },
  { label: 'Move Mode', desc: 'How activity builds mental resilience.', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '⚡' },
  { label: 'Cognitive Strain', desc: 'Screen time effects on concentration.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🧩' },
  { label: 'Social Energy', desc: 'Connections fuelling your wellbeing.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '💬' },
]

const FEATURES = [
  { icon: '📊', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', title: 'Smart Dashboard', desc: 'Your pet Brainy reacts to your habits. Watch domain vitals update in real time with priority focus areas and personalised brain boosts.', tag: 'Dashboard' },
  { icon: '📋', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', title: 'Daily Habit Tracker', desc: 'Log sleep, screen time, and activity. Charts reveal patterns over time so you can spot what is actually helping your brain.', tag: 'Habit Tracker' },
  { icon: '🎮', color: '#10b981', bg: 'rgba(16,185,129,0.08)', title: 'Cognitive Mini Games', desc: 'Five science-backed games — Reaction Test, Memory Match, Stroop Test, Visual Pattern, and Mental Math — with a global leaderboard.', tag: 'Mini Games' },
  { icon: '📚', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', title: 'Personalised Article Hub', desc: 'Reads recommended from your weakest domains. Sleep dragging? Sleep articles appear first. Focus broken? Screen time tips show up.', tag: 'Article Hub' },
  { icon: '🏆', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', title: 'Progress & Achievements', desc: 'Track streaks, unlock 30 game achievements, and watch scores improve over time with detailed performance charts.', tag: 'Progress' },
  { icon: '🧠', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', title: 'Brain Snapshot', desc: 'A personalised score across 4 domains generated from 5 honest questions about your real daily habits. Ready in 5 minutes.', tag: 'Onboarding' },
]

// Stroop Test mini preview
function StroopPreview() {
  const words = [
    { word: 'RED', color: '#3b82f6' },
    { word: 'BLUE', color: '#ef4444' },
    { word: 'GREEN', color: '#f59e0b' },
    { word: 'YELLOW', color: '#10b981' },
  ]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % words.length), 1200)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="mini-preview stroop-preview">
      <div className="mini-preview-label">Stroop Test</div>
      <div className="stroop-word" style={{ color: words[idx].color }}>{words[idx].word}</div>
      <div className="stroop-hint">What colour is the text?</div>
      <div className="stroop-options">
        {['Red', 'Blue', 'Green', 'Yellow'].map(c => (
          <div key={c} className="stroop-opt" style={{ borderColor: c === words[idx].word ? '#10b981' : 'transparent', background: c === words[idx].word ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)' }}>{c}</div>
        ))}
      </div>
    </div>
  )
}

// Memory Match mini preview
function MemoryPreview() {
  const emojis = ['🧠','⚡','🎯','🔥','🌙','⭐']
  const [flipped, setFlipped] = useState([0, 3])
  useEffect(() => {
    const t = setInterval(() => {
      const a = Math.floor(Math.random() * 6)
      let b = Math.floor(Math.random() * 6)
      while (b === a) b = Math.floor(Math.random() * 6)
      setFlipped([a, b])
    }, 1500)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="mini-preview memory-preview">
      <div className="mini-preview-label">Memory Match</div>
      <div className="memory-mini-grid">
        {emojis.map((e, i) => (
          <div key={i} className={`memory-mini-card ${flipped.includes(i) ? 'flipped' : ''}`}>
            <div className="memory-mini-front">?</div>
            <div className="memory-mini-back">{e}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Reaction Test mini preview
function ReactionPreview() {
  const [phase, setPhase] = useState('wait')
  useEffect(() => {
    let t
    function cycle() {
      setPhase('wait')
      t = setTimeout(() => {
        setPhase('go')
        t = setTimeout(cycle, 900)
      }, 1800 + Math.random() * 800)
    }
    cycle()
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="mini-preview reaction-preview">
      <div className="mini-preview-label">Reaction Test</div>
      <div className={`reaction-btn ${phase}`}>
        {phase === 'wait' ? 'Wait...' : 'TAP!'}
      </div>
      <div className="reaction-sub">{phase === 'wait' ? 'Stay focused' : 'React fast!'}</div>
    </div>
  )
}

// Mental Math mini preview
function MathPreview() {
  const questions = ['12 + 29', '8 × 7', '64 - 17', '9 × 8', '45 + 38']
  const answers = [41, 56, 47, 72, 83]
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  useEffect(() => {
    const t = setInterval(() => {
      setSelected(null)
      setTimeout(() => {
        setSelected(answers[idx])
        setTimeout(() => setIdx(i => (i + 1) % questions.length), 600)
      }, 800)
    }, 2000)
    return () => clearInterval(t)
  }, [idx])
  const opts = [answers[idx] - 5, answers[idx], answers[idx] + 3, answers[idx] - 9].sort(() => Math.random() - 0.5)
  return (
    <div className="mini-preview math-preview">
      <div className="mini-preview-label">Mental Math</div>
      <div className="math-question">{questions[idx]}</div>
      <div className="math-opts">
        {[answers[idx] - 7, answers[idx], answers[idx] + 4, answers[idx] - 12].map((o, i) => (
          <div key={i} className={`math-opt ${selected === o ? 'correct' : ''}`}>{o}</div>
        ))}
      </div>
    </div>
  )
}

// Animated floating dashboard widget
function DashWidget() {
  const [score, setScore] = useState(72)
  useEffect(() => {
    const t = setInterval(() => setScore(s => s + (Math.random() > 0.5 ? 1 : -1)), 2000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="dash-widget">
      <div className="dash-widget-header">
        <span className="dash-widget-title">Your Brain Vibe</span>
        <span className="dash-widget-badge">Live</span>
      </div>
      <div className="dash-widget-score">{score}<span>/100</span></div>
      <div className="dash-widget-bars">
        {[
          { label: 'Sleep', val: 80, color: '#3b82f6' },
          { label: 'Focus', val: 45, color: '#ef4444' },
          { label: 'Energy', val: 90, color: '#10b981' },
          { label: 'Social', val: 70, color: '#8b5cf6' },
        ].map(b => (
          <div key={b.label} className="dash-bar-row">
            <span className="dash-bar-label">{b.label}</span>
            <div className="dash-bar-track">
              <div className="dash-bar-fill" style={{ width: `${b.val}%`, background: b.color }} />
            </div>
            <span className="dash-bar-val" style={{ color: b.color }}>{b.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()

  function handleGoToApp() {
    const snapshot = JSON.parse(localStorage.getItem('brainboostSnapshot') || '{}')
    if (snapshot && Object.keys(snapshot).length > 0) navigate('/dashboard')
    else navigate('/onboarding')
  }

  function handleGuestLogin() {
    getOrCreateGuestId()
    localStorage.setItem('bb_is_guest', 'true')
    navigate('/onboarding')
  }

  return (
    <div className="home-page">
      <div className="home-grain" />

      {/* Ambient blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Nav */}
      <nav className="home-nav">
        <div className="home-logo">Brain<span>Boost</span></div>
        <div className="home-nav-links">
          <SignedOut>
            <SignInButton mode="modal"><button className="nav-link-btn">Sign In</button></SignInButton>
            <SignUpButton mode="modal"><button className="nav-cta-btn">Get Started</button></SignUpButton>
          </SignedOut>
          <SignedIn>
            <button className="nav-cta-btn" onClick={handleGoToApp}>Go to Dashboard</button>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            Free to use &nbsp;·&nbsp; No app needed &nbsp;·&nbsp; 5 minutes
          </div>
          <h1 className="hero-title">
            Your brain on<br />
            <span className="hero-title-accent">autopilot?</span>
          </h1>
          <p className="hero-sub">
            Find out how sleep, movement, screen time, and social habits are quietly shaping your focus in under 5 minutes.
          </p>
          <div className="hero-actions">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="btn-main">Get my snapshot →</button>
              </SignUpButton>
              <button className="btn-ghost-link" onClick={handleGuestLogin}>Try as guest</button>
            </SignedOut>
            <SignedIn>
              <button className="btn-main" onClick={handleGoToApp}>Go to Dashboard →</button>
            </SignedIn>
          </div>
          <div className="hero-floating-badges">
            <span className="hero-badge">🧠 Brain snapshot</span>
            <span className="hero-badge">🎮 5 mini games</span>
            <span className="hero-badge">📈 Progress tracking</span>
            <span className="hero-badge">🏆 Leaderboard</span>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-visual">
            <DashWidget />
            <div className="hero-float-card card-streak">
              <span className="float-icon">🔥</span>
              <div><div className="float-title">7 day streak</div><div className="float-sub">Keep it going!</div></div>
            </div>
            <div className="hero-float-card card-achievement">
              <span className="float-icon">🏆</span>
              <div><div className="float-title">Achievement unlocked</div><div className="float-sub">Big Brain Behavior</div></div>
            </div>
            <div className="hero-float-card card-insight">
              <span className="float-icon">💡</span>
              <div><div className="float-title">Focus insight</div><div className="float-sub">Screen time is getting loud</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats-strip">
        <div className="stat-item"><span className="stat-big">1<em>in 3</em></span><span className="stat-desc">students struggle with focus daily</span></div>
        <div className="stat-divider" />
        <div className="stat-item"><span className="stat-big">5<em>min</em></span><span className="stat-desc">to get your personalised score</span></div>
        <div className="stat-divider" />
        <div className="stat-item"><span className="stat-big">4<em>domains</em></span><span className="stat-desc">of brain health measured</span></div>
      </div>

      {/* Features */}
      <section className="features-section">
        <div className="features-label">Everything you need</div>
        <h2 className="features-title">A complete brain health toolkit</h2>
        <p className="features-sub">Six interconnected tools that work together to help you understand and improve your mental performance.</p>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card" style={{ '--fc': f.color, '--fb': f.bg }}>
              <div className="feature-card-top">
                <div className="feature-card-icon">{f.icon}</div>
                <div className="feature-card-tag">{f.tag}</div>
              </div>
              <div className="feature-card-title">{f.title}</div>
              <div className="feature-card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mini Games Preview */}
      <section className="games-preview-section">
        <div className="features-label">Interactive previews</div>
        <h2 className="features-title">Train your brain, live</h2>
        <p className="features-sub">Five cognitive games designed to sharpen different aspects of brain performance. Try them now.</p>
        <div className="games-preview-grid">
          <StroopPreview />
          <MemoryPreview />
          <ReactionPreview />
          <MathPreview />
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="how-label">How it works</div>
        <div className="how-steps">
          {[
            { n: '01', t: 'Answer honestly', d: '5 questions about your real daily habits.', icon: '✏️' },
            { n: '02', t: 'Get your snapshot', d: 'A personalised score across 4 brain health domains.', icon: '📊' },
            { n: '03', t: 'Track daily', d: 'Log habits and play games to keep Brainy healthy.', icon: '📋' },
            { n: '04', t: 'Improve focus', d: 'Articles and insights targeted at your lowest scores.', icon: '🎯' },
          ].map((step, i) => (
            <div key={step.n} className="how-step how-step-v2">
              <div className="how-step-icon">{step.icon}</div>
              <div className="step-n">{step.n}<em>step</em></div>
              <div className="step-t">{step.t}</div>
              <div className="step-d">{step.d}</div>
              {i < 3 && <div className="how-step-arrow">→</div>}
            </div>
          ))}
        </div>

        <div className="how-domains-label">What we measure</div>
        <div className="how-domain-cards">
          {DOMAINS.map(domain => (
            <div key={domain.label} className="how-domain-card how-domain-v2" style={{ '--dc': domain.color, '--dbg': domain.bg }}>
              <div className="domain-icon">{domain.icon}</div>
              <div className="how-domain-card-label">{domain.label}</div>
              <div className="how-domain-card-desc">{domain.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Wellness section */}
      <section className="wellness-section">
        <div className="features-label">Cognitive wellness</div>
        <h2 className="features-title">Every dimension of your mental performance</h2>
        <div className="wellness-pills">
          {[
            { label: 'Focus', color: '#3b82f6', icon: '🎯' },
            { label: 'Sleep Quality', color: '#6366f1', icon: '🌙' },
            { label: 'Stress', color: '#ef4444', icon: '😤' },
            { label: 'Cognitive Load', color: '#f59e0b', icon: '🧩' },
            { label: 'Executive Function', color: '#8b5cf6', icon: '⚡' },
            { label: 'Reaction Speed', color: '#10b981', icon: '⚡' },
            { label: 'Working Memory', color: '#ec4899', icon: '🧠' },
            { label: 'Social Wellbeing', color: '#14b8a6', icon: '💬' },
            { label: 'Attention Control', color: '#f97316', icon: '👁️' },
            { label: 'Mental Clarity', color: '#06b6d4', icon: '✨' },
          ].map(p => (
            <div key={p.label} className="wellness-pill" style={{ '--pc': p.color }}>
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="final-cta-inner">
          <div className="cta-blob cta-blob-1" />
          <div className="cta-blob cta-blob-2" />
          <p className="final-cta-kicker">Ready?</p>
          <h2 className="final-cta-title">Understand what is<br />draining your brain.</h2>
          <p className="final-cta-sub">Join students already using CogniCompass to track habits, play games, and improve focus.</p>
          <SignedOut>
            <div className="cta-actions">
              <SignUpButton mode="modal">
                <button className="btn-main btn-main-lg btn-glow">Start my snapshot →</button>
              </SignUpButton>
              <button className="cta-ghost" onClick={handleGuestLogin}>Try as guest — no sign up needed</button>
            </div>
          </SignedOut>
          <SignedIn>
            <button className="btn-main btn-main-lg btn-glow" onClick={handleGoToApp}>Get Started!</button>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-logo">Brain<span>Boost</span></div>
        <p className="home-trust-note">
          CogniCompass only uses your responses to personalise insights, habit tracking, progress, and recommendations. We do not sell user data or use it for advertising.
        </p>
        <details className="home-privacy-card">
          <summary>
            <span className="privacy-summary-main">Data &amp; Privacy Disclaimer</span>
            <span className="privacy-summary-sub">How CogniCompass uses data responsibly</span>
          </summary>
          <div className="home-privacy-content">
            <div className="privacy-intro">
              <div className="privacy-intro-badge">Research-informed questions</div>
              <p>CogniCompass is a student wellbeing and brain-health habit app developed for educational purposes. It helps users reflect on lifestyle habits such as sleep, screen time, physical activity, and social wellbeing.</p>
            </div>
            <div className="privacy-principles" aria-label="Privacy principles">
              <span>Transparency</span><span>Purpose limitation</span><span>Data minimisation</span><span>Privacy by design</span>
            </div>
            <div className="privacy-grid">
              <section className="privacy-info-card"><h3>What we may collect</h3><p>Research-informed onboarding responses, daily check-ins, sleep range, screen-time range, physical activity response, article interaction patterns, progress history, and basic account or guest-session identifiers.</p></section>
              <section className="privacy-info-card"><h3>Why we use it</h3><p>To generate your brain-health snapshot, personalise dashboard insights, recommend relevant articles, track habit progress, calculate streaks, and improve the prototype experience.</p></section>
              <section className="privacy-info-card"><h3>Guest and signed-in use</h3><p>Guest information may be stored locally in your browser or linked to a temporary guest ID. Signed-in users may use Clerk authentication to protect accounts and connect progress to a user profile.</p></section>
              <section className="privacy-info-card"><h3>Recommendation transparency</h3><p>Article recommendations are based on your onboarding snapshot and lower-scoring habit domains. They are educational only and should not be interpreted as medical advice, clinical assessment, or diagnosis.</p></section>
            </div>
            <div className="privacy-commitments">
              <div><strong>We collect only what the app needs.</strong><span>Where possible, CogniCompass uses general habit ranges rather than highly detailed health records.</span></div>
              <div><strong>We do not sell your data.</strong><span>Your data is not used for advertising or unrelated purposes.</span></div>
              <div><strong>You stay in control.</strong><span>You may choose not to provide certain information, use guest mode where available, or stop using the app at any time.</span></div>
            </div>
            <div className="privacy-support-note">CogniCompass is not a medical, psychological, or diagnostic tool and does not replace advice from a qualified health professional.</div>
          </div>
        </details>
      </footer>
    </div>
  )
}
