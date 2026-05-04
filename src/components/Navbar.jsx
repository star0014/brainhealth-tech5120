// ─────────────────────────────────────────────────────────────────────────────
// Navbar component — shown on every authenticated page above the main content.
//
// Behaviour:
//   - Reads the stored snapshot to determine whether onboarding is complete.
//   - If onboarding is NOT complete, navigation tabs redirect to /onboarding instead
//     of their normal destination to prevent users accessing pages that depend on a snapshot.
//   - The "Onboarding" tab itself is hidden once the user has completed onboarding
//     (either as a signed-in Clerk user or as a guest who has finished the questionnaire).
//   - The Clerk UserButton is rendered at the far right for signed-in users; it is
//     simply invisible for guests (Clerk renders nothing if no user is signed in).
// ─────────────────────────────────────────────────────────────────────────────
import { Link, useLocation } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import './Navbar.css'
import { getSnapshot, hasCompletedOnboarding } from '../utils/recommendations'

function Navbar() {
  const location = useLocation()

  // Read the stored onboarding snapshot to decide whether to unlock the main nav tabs.
  const snapshot = getSnapshot()
  const canAccessProtectedPages = hasCompletedOnboarding(snapshot)

  // Determine whether the "Onboarding" tab should be hidden.
  // It is hidden if the user is a signed-in Clerk user OR if they are a guest who
  // has already completed the questionnaire.
  const isGuest = localStorage.getItem('bb_is_guest') === 'true'
  const guestDone = isGuest && canAccessProtectedPages
  const { isSignedIn } = useUser()
  const hideOnboarding = guestDone || isSignedIn  // true → don't show the Onboarding tab

  return (
    <nav className="navbar">
      {/* Left side: brand logo and home icon button */}
      <div className="navbar-left">
        {/* BrainBoost brand name — clicking takes the user back to the marketing home page */}
        <Link to="/" className="navbar-logo">Brain<span>Boost</span></Link>
        {/* Home icon button — an alternative shortcut to the home page */}
        <Link to="/" className="navbar-home-btn" title="Back to Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </Link>
      </div>

      {/* Centre: main navigation tabs.
          Each tab checks canAccessProtectedPages; if false, the tab points to /onboarding
          instead of its normal destination so the user completes the questionnaire first. */}
      <div className="navbar-tabs">
        {/* Onboarding tab: hidden once the user has already gone through it */}
        {!hideOnboarding && (
          <Link to="/onboarding" className={`nav-tab ${location.pathname === '/onboarding' ? 'active' : ''}`}>Onboarding</Link>
        )}
        {/* Dashboard: main results screen with pet, domain scores, and article recommendations */}
        <Link to={canAccessProtectedPages ? '/dashboard' : '/onboarding'} className={`nav-tab ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
        {/* Habit Tracker: daily check-in for sleep, screen time, and physical activity */}
        <Link to={canAccessProtectedPages ? '/habits' : '/onboarding'} className={`nav-tab ${location.pathname === '/habits' ? 'active' : ''}`}>Habit Tracker</Link>
        {/* Mini Games: open to all users regardless of onboarding status */}
        <Link to="/games" className={`nav-tab ${location.pathname === '/games' ? 'active' : ''}`}>Mini Games</Link>
        {/* Progress: streak, milestones, and game history */}
        <Link to={canAccessProtectedPages ? '/progress' : '/onboarding'} className={`nav-tab ${location.pathname === '/progress' ? 'active' : ''}`}>Progress</Link>
        {/* Article Hub: personalised reads based on the snapshot's weakest domains */}
        <Link to={canAccessProtectedPages ? '/articles' : '/onboarding'} className={`nav-tab ${location.pathname === '/articles' ? 'active' : ''}`}>Article Hub</Link>
      </div>

      {/* Right side: Clerk UserButton — shows the user's avatar and a sign-out option.
          Renders nothing for guest users since they have no Clerk account. */}
      <UserButton />
    </nav>
  )
}

export default Navbar
