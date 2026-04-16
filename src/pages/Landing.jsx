// Landing page for BrainBoost — entry point before onboarding.
// Matches the soft teal/blue aesthetic from Dashboard and Onboarding.
import { Link } from 'react-router-dom'
import './Landing.css'

const FEATURES = [
  {
    icon: '🌙',
    title: 'Sleep Rhythm',
    desc: 'Understand how your rest patterns shape your daily energy and focus.',
    color: 'sleep_rhythm',
  },
  {
    icon: '⚡',
    title: 'Move Mode',
    desc: 'See how your movement habits build resilience and mental clarity.',
    color: 'move_mode',
  },
  {
    icon: '🧠',
    title: 'Cognitive Strain',
    desc: 'Track how screen time and mental load affect your concentration.',
    color: 'cognitive_strain',
  },
  {
    icon: '🤝',
    title: 'Social Energy',
    desc: 'Measure how your social connections fuel or drain your wellbeing.',
    color: 'social_energy',
  },
]

const STEPS = [
  { num: '01', label: 'Answer 5 quick questions', sub: 'No sign-up needed. Takes under 2 minutes.' },
  { num: '02', label: 'Get your Brain Health Snapshot', sub: 'A personalised score across 4 domains.' },
  { num: '03', label: 'Meet Brainy', sub: 'Your brain pet reflects your current state in real time.' },
  { num: '04', label: 'Read what matters to you', sub: 'Smart article picks based on your lowest scores.' },
]

function Landing() {
  return (
    <div className="landing-wrap">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-icon">🧠</span>
          <span className="landing-logo-text">BrainBoost</span>
        </div>
        <div className="landing-nav-links">
          <Link className="landing-nav-link" to="/onboarding">Take the quiz</Link>
          {/* <Link className="landing-nav-link" to="/dashboard">Dashboard</Link>
          <Link className="landing-nav-link" to="/articles">Articles</Link> */}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-blob blob-1" />
        <div className="hero-bg-blob blob-2" />

        <div className="hero-content">
          <div className="hero-eyebrow">Your brain health snapshot</div>
          <h1 className="hero-heading">
            How's your brain<br />doing <em>right now</em>?
          </h1>
          <p className="hero-sub">
            Answer 5 honest questions about your sleep, movement, screen habits, and social life.
            Get a personalised score — and a brain pet that shows you exactly how you're doing.
          </p>
          <div className="hero-cta-row">
            <Link className="cta-primary" to="/onboarding">
              Start my snapshot →
            </Link>
            {/* <Link className="cta-ghost" to="/dashboard">
              View demo dashboard
            </Link> */}
          </div>
          <div className="hero-disclaimer">
            Free · No sign-up · Not a medical assessment
          </div>
        </div>

        {/* Brainy pet illustration */}
        <div className="hero-pet-wrap">
          <div className="hero-pet-glow" />
          <div className="hero-pet-card">
            <svg className="hero-brainy" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
              {/* Body */}
              <circle cx="80" cy="90" r="58" fill="#7BAACF" />
              {/* Sheen */}
              <ellipse cx="62" cy="66" rx="18" ry="12" fill="rgba(255,255,255,0.18)" transform="rotate(-20 62 66)" />
              {/* Eyes */}
              <ellipse cx="62" cy="85" rx="10" ry="11" fill="white" />
              <ellipse cx="98" cy="85" rx="10" ry="11" fill="white" />
              <circle cx="65" cy="87" r="5.5" fill="#2c4a6e" />
              <circle cx="101" cy="87" r="5.5" fill="#2c4a6e" />
              <circle cx="67" cy="85" r="2" fill="white" />
              <circle cx="103" cy="85" r="2" fill="white" />
              {/* Sleepy lids */}
              <path d="M52 80 Q62 76 72 80" stroke="#7BAACF" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              <path d="M88 80 Q98 76 108 80" stroke="#7BAACF" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
              {/* Cheeks */}
              <ellipse cx="50" cy="98" rx="10" ry="6" fill="rgba(255,150,150,0.3)" />
              <ellipse cx="110" cy="98" rx="10" ry="6" fill="rgba(255,150,150,0.3)" />
              {/* Mouth — yawn */}
              <path d="M68 108 Q80 118 92 108" stroke="#2c4a6e" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              {/* Z's */}
              <text x="114" y="52" fontSize="14" fill="#a8c8e8" fontWeight="bold" fontFamily="serif">Z</text>
              <text x="126" y="36" fontSize="10" fill="#c0d8ee" fontWeight="bold" fontFamily="serif">z</text>
            </svg>

            <div className="hero-pet-badge">😴 Tired</div>
            <div className="hero-pet-speech">
              "Yaaawn… take the quiz and help me feel better!"
            </div>
            <div className="hero-pet-score">
              <span className="hero-pet-score-label">Overall score</span>
              <span className="hero-pet-score-val"><span>/100</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="steps-section">
        <div className="section-label">How it works</div>
        <h2 className="section-heading">Four steps to clarity</h2>
        <div className="steps-grid">
          {STEPS.map((step) => (
            <div key={step.num} className="step-card">
              <div className="step-num">{step.num}</div>
              <div className="step-label">{step.label}</div>
              <div className="step-sub">{step.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Domains ─────────────────────────────────────────────────────────── */}
      <section className="domains-section">
        <div className="section-label">What we measure</div>
        <h2 className="section-heading">Four domains. One clear picture.</h2>
        <div className="domains-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className={`domain-card domain-${f.color}`}>
              <div className="domain-icon">{f.icon}</div>
              <div className="domain-title">{f.title}</div>
              <div className="domain-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="cta-banner-bg" />
        <div className="cta-banner-content">
          <h2 className="cta-banner-heading">Ready to meet your brain?</h2>
          <p className="cta-banner-sub">
            Your snapshot is waiting. It takes less than 2 minutes and you'll walk away knowing
            exactly what to focus on first.
          </p>
          <Link className="cta-primary cta-large" to="/onboarding">
            Start my snapshot →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <span>🧠</span> BrainBoost
        </div>
        <div className="footer-disclaimer">
          BrainBoost provides lifestyle awareness only. It is not a medical, psychological, or
          diagnostic assessment.
        </div>
        <div className="footer-links">
          <Link to="/onboarding">Take the quiz</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/articles">Article Hub</Link>
        </div>
      </footer>
    </div>
  )
}

export default Landing
