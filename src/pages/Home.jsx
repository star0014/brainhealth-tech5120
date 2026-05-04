// ─────────────────────────────────────────────────────────────────────────────
// Home page — the public-facing marketing / landing page for BrainBoost.
//
// Sections:
//   1. Navbar (brand + auth buttons)
//   2. Hero    (headline, sub-copy, hero image)
//   3. Stats strip  (3 key numbers)
//   4. How it works (3 steps + 4 domain cards)
//   5. Final CTA    (sign-up button)
//   6. Footer
//
// Auth states:
//   SignedOut → shows Sign In / Get Started buttons and a "Try as guest" link.
//   SignedIn  → shows "Open App" button and the Clerk UserButton (avatar).
// ─────────────────────────────────────────────────────────────────────────────
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { getOrCreateGuestId } from '../utils/guestAuth'
import './Home.css'

// Domain card data — displayed in the "What we measure" section.
// Each entry maps to one of the four brain-health domains measured by the questionnaire.
// color: foreground text/icon colour; bg: soft background tint for the card.
const DOMAINS = [
  { label: 'Sleep Rhythm', desc: 'How your rest patterns shape daily energy and focus.', color: '#1a6fa8', bg: '#e0f0ff' },
  { label: 'Move Mode', desc: 'How movement habits build resilience and mental clarity.', color: '#1a7a5e', bg: '#dcf5ec' },
  { label: 'Cognitive Strain', desc: 'How screen time and mental load affect your concentration.', color: '#b45309', bg: '#fef3c7' },
  { label: 'Social Energy', desc: 'How social connections fuel or drain your overall wellbeing.', color: '#6b2fa0', bg: '#f3e8ff' },
]

function Home() {
  const navigate = useNavigate()

  // Decides where to send a signed-in user who clicks "Open App" or "Get Started".
  // If a snapshot already exists in localStorage (i.e. they've done onboarding before),
  // go straight to the dashboard; otherwise start the onboarding flow.
  function handleGoToApp() {
    const snapshot = JSON.parse(localStorage.getItem('brainboostSnapshot') || '{}')
    if (snapshot && Object.keys(snapshot).length > 0) navigate('/dashboard')
    else navigate('/onboarding')
  }

  // Sets up a guest session and redirects to the onboarding questionnaire.
  // getOrCreateGuestId() creates a random stable ID and persists it in localStorage.
  // Setting 'bb_is_guest' = 'true' activates guest-mode UI throughout the app.
  function handleGuestLogin() {
    getOrCreateGuestId()
    localStorage.setItem('bb_is_guest', 'true')
    navigate('/onboarding')
  }

  return (
    <div className="home-page">
      {/* Subtle grain texture overlay for visual depth */}
      <div className="home-grain" />

      {/* ── Top navigation bar ──────────────────────────────────────────────── */}
      <nav className="home-nav">
        <div className="home-logo">Brain<span>Boost</span></div>
        <div className="home-nav-links">
          {/* Signed-out state: show modal Sign In and Sign Up buttons */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="nav-link-btn">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="nav-cta-btn">Get Started</button>
            </SignUpButton>
          </SignedOut>
          {/* Signed-in state: show "Open App" shortcut and the Clerk user avatar */}
          <SignedIn>
            <button className="nav-cta-btn" onClick={handleGoToApp}>Open App</button>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* ── Hero section ───────────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="hero-left">
          <h1 className="hero-title">
            Your brain on<br />
            <span className="hero-title-accent">autopilot?</span>
          </h1>
          <p className="hero-sub">
            Find out how sleep, movement, screen time, and social habits are quietly shaping your focus in under 5 minutes.
          </p>
          {/* "Try as guest" is only shown to signed-out users — signed-in users go directly */}
          <SignedOut>
            <button className="btn-ghost-link" onClick={handleGuestLogin}>Try as guest</button>
          </SignedOut>
        </div>
        <div className="hero-right">
          <img
            className="hero-img"
            src="https://blog.medicalert.org/wp-content/uploads/2025/03/Brain-Fog-Header-Image.jpg"
            alt="Brain health"
          />
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      {/* Three attention-grabbing statistics that establish credibility and urgency */}
      <div className="stats-strip">
        <div className="stat-item">
          <span className="stat-big">1<em>in 3</em></span>
          <span className="stat-desc">students struggle with focus daily</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-big">5<em>min</em></span>
          <span className="stat-desc">to get your personalised score</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-big">4<em>domains</em></span>
          <span className="stat-desc">of brain health measured</span>
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="how-section">
        <div className="how-label">How it works</div>
        {/* Three-step process cards — rendered from an inline array for conciseness */}
        <div className="how-steps">
          {[
            { n: '01', t: 'Answer honestly', d: '5 questions about your real daily habits.' },
            { n: '02', t: 'Get your snapshot', d: 'A personalised score across 4 brain health domains.' },
            { n: '03', t: 'Read what matters', d: 'Articles and tips targeted at your lowest scores.' },
          ].map((step) => (
            <div key={step.n} className="how-step">
              <div className="step-n">{step.n}<em>step</em></div>
              <div className="step-t">{step.t}</div>
              <div className="step-d">{step.d}</div>
            </div>
          ))}
        </div>

        <div className="how-domains-label">What we measure</div>
        {/* Domain cards — CSS custom properties (--dc, --dbg) drive the accent colours */}
        <div className="how-domain-cards">
          {DOMAINS.map((domain) => (
            <div key={domain.label} className="how-domain-card" style={{ '--dc': domain.color, '--dbg': domain.bg }}>
              <div className="how-domain-card-label">{domain.label}</div>
              <div className="how-domain-card-desc">{domain.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="final-cta">
        <div className="final-cta-inner">
          <p className="final-cta-kicker">Ready?</p>
          <h2 className="final-cta-title">Understand what's<br />draining your brain.</h2>
          {/* Signed-out: open the Clerk sign-up modal */}
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="btn-main btn-main-lg">Start my snapshot</button>
            </SignUpButton>
          </SignedOut>
          {/* Signed-in: go to dashboard or onboarding depending on snapshot state */}
          <SignedIn>
            <button className="btn-main btn-main-lg" onClick={handleGoToApp}>Get Started!</button>
          </SignedIn>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="home-footer">
        <div className="home-logo">Brain<span>Boost</span></div>
      </footer>
    </div>
  )
}

export default Home
