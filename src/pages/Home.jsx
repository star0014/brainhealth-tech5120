import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"
import { getOrCreateGuestId } from "../utils/guestAuth"
import "./Home.css"

const DOMAINS = [
  { label: "Sleep Rhythm",    desc: "How your rest patterns shape daily energy and focus.",           color: "#1a6fa8", bg: "#e0f0ff" },
  { label: "Move Mode",        desc: "How movement habits build resilience and mental clarity.",        color: "#1a7a5e", bg: "#dcf5ec" },
  { label: "Cognitive Strain", desc: "How screen time and mental load affect your concentration.",      color: "#b45309", bg: "#fef3c7" },
  { label: "Social Energy",   desc: "How social connections fuel or drain your overall wellbeing.",    color: "#6b2fa0", bg: "#f3e8ff" },
]

function Home() {
  const navigate = useNavigate()

  function handleGoToApp() {
    const snapshot = JSON.parse(localStorage.getItem("brainboostSnapshot") || "{}")
    if (snapshot && Object.keys(snapshot).length > 0) navigate("/dashboard")
    else navigate("/onboarding")
  }

  function handleGuestLogin() {
    getOrCreateGuestId()
    localStorage.setItem("bb_is_guest", "true")
    navigate("/onboarding")
  }

  return (
    <div className="home-page">
      <div className="home-grain" />

      {/* Nav */}
      <nav className="home-nav">
        <div className="home-logo">Brain<span>Boost</span></div>
        <div className="home-nav-links">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="nav-link-btn">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="nav-cta-btn">Get Started →</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <button className="nav-cta-btn" onClick={handleGoToApp}>Open App →</button>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* Hero — two column: text left, image right */}
      <section className="home-hero">
        <div className="hero-left">
          <h1 className="hero-title">
            Your brain on<br />
            <span className="hero-title-accent">autopilot?</span>
          </h1>
          <p className="hero-sub">
            Find out how sleep, movement, screen time, and social habits are quietly shaping your focus — in under 5 minutes.
          </p>
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

      {/* Stats strip */}
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

      {/* How it works */}
      <section className="how-section">
        <div className="how-label">How it works</div>
        <div className="how-steps">
          {[
            { n: "01", t: "Answer honestly",   d: "5 questions about your real daily habits." },
            { n: "02", t: "Get your snapshot", d: "A personalised score across 4 brain health domains." },
            { n: "03", t: "Read what matters", d: "Articles and tips targeted at your lowest scores." },
          ].map(s => (
            <div key={s.n} className="how-step">
              <div className="step-n">{s.n}<em>step</em></div>
              <div className="step-t">{s.t}</div>
              <div className="step-d">{s.d}</div>
            </div>
          ))}
        </div>

        <div className="how-domains-label">What we measure</div>
        <div className="how-domain-cards">
          {DOMAINS.map(d => (
            <div key={d.label} className="how-domain-card" style={{ "--dc": d.color, "--dbg": d.bg }}>
              <div className="how-domain-card-label">{d.label}</div>
              <div className="how-domain-card-desc">{d.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="final-cta-inner">
          <p className="final-cta-kicker">Ready?</p>
          <h2 className="final-cta-title">Understand what's<br />draining your brain.</h2>
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="btn-main btn-main-lg">Start my snapshot →</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <button className="btn-main btn-main-lg" onClick={handleGoToApp}>Get Started!</button>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-logo">Brain<span>Boost</span></div>
      </footer>
    </div>
  )
}

export default Home