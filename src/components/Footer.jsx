// ─────────────────────────────────────────────────────────────────────────────
// Footer — shared data & privacy disclaimer shown on all app pages.
// Extracted from Home.jsx so it renders consistently across the entire app
// without duplicating markup in every page component.
// ─────────────────────────────────────────────────────────────────────────────
import './Footer.css'

function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-logo">Brain<span>Boost</span></div>
        <p className="app-footer-trust">
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
              <p>
                CogniCompass is a student wellbeing and brain-health habit app developed for educational purposes. It helps users reflect on lifestyle habits such as sleep, screen time, physical activity, and social wellbeing. Each questionnaire area is informed by published journal research and translated into simple habit-range questions for reflection.
              </p>
            </div>
            <div className="privacy-principles" aria-label="Privacy principles">
              <span>Transparency</span>
              <span>Purpose limitation</span>
              <span>Data minimisation</span>
              <span>Privacy by design</span>
            </div>
            <div className="privacy-grid">
              <section className="privacy-info-card">
                <h3>What we may collect</h3>
                <p>Research-informed onboarding responses, daily check-ins, sleep range, screen-time range, physical activity response, article interaction patterns, progress history, and basic account or guest-session identifiers.</p>
              </section>
              <section className="privacy-info-card">
                <h3>Why we use it</h3>
                <p>To generate your brain-health snapshot, personalise dashboard insights, recommend relevant articles, track habit progress, calculate streaks, and improve the prototype experience.</p>
              </section>
              <section className="privacy-info-card">
                <h3>Guest and signed-in use</h3>
                <p>Guest information may be stored locally in your browser or linked to a temporary guest ID. Signed-in users may use Clerk authentication to protect accounts and connect progress to a user profile.</p>
              </section>
              <section className="privacy-info-card">
                <h3>Recommendation transparency</h3>
                <p>Article recommendations are based on your onboarding snapshot and lower-scoring habit domains. They are educational only and should not be interpreted as medical advice, clinical assessment, or diagnosis.</p>
              </section>
            </div>
            <div className="privacy-commitments">
              <div>
                <strong>We collect only what the app needs.</strong>
                <span>Where possible, CogniCompass uses general habit ranges rather than highly detailed health records.</span>
              </div>
              <div>
                <strong>We do not sell your data.</strong>
                <span>Your data is not used for advertising or unrelated purposes.</span>
              </div>
              <div>
                <strong>You stay in control.</strong>
                <span>You may choose not to provide certain information, use guest mode where available, or stop using the app at any time.</span>
              </div>
            </div>
            <div className="privacy-support-note">
              CogniCompass is not a medical, psychological, or diagnostic tool and does not replace advice from a qualified health professional. If you are experiencing serious stress, sleep problems, mental health concerns, or medical symptoms, seek support from a qualified health professional or trusted support service.
            </div>
          </div>
        </details>
      </div>
    </footer>
  )
}

export default Footer
