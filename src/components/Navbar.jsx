import { Link, useLocation } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import './Navbar.css'
import { getSnapshot, hasCompletedOnboarding } from '../utils/recommendations'

function Navbar() {
  const location = useLocation()
  const snapshot = getSnapshot()
  const canAccessProtectedPages = hasCompletedOnboarding(snapshot)

  const isGuest = localStorage.getItem('bb_is_guest') === 'true'
  const guestDone = isGuest && canAccessProtectedPages
  const { isSignedIn } = useUser()
  const hideOnboarding = guestDone || isSignedIn

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">Brain<span>Boost</span></Link>
        <Link to="/" className="navbar-home-btn" title="Back to Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </Link>
      </div>
      <div className="navbar-tabs">
        {!hideOnboarding && (
          <Link to="/onboarding" className={`nav-tab ${location.pathname === '/onboarding' ? 'active' : ''}`}>Onboarding</Link>
        )}
        <Link to={canAccessProtectedPages ? '/dashboard' : '/onboarding'} className={`nav-tab ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
        <Link to={canAccessProtectedPages ? '/habits' : '/onboarding'} className={`nav-tab ${location.pathname === '/habits' ? 'active' : ''}`}>Habit Tracker</Link>
        <Link to="/games" className={`nav-tab ${location.pathname === '/games' ? 'active' : ''}`}>Mini Games</Link>
        <Link to={canAccessProtectedPages ? '/progress' : '/onboarding'} className={`nav-tab ${location.pathname === '/progress' ? 'active' : ''}`}>Progress</Link>
        <Link to={canAccessProtectedPages ? '/articles' : '/onboarding'} className={`nav-tab ${location.pathname === '/articles' ? 'active' : ''}`}>Article Hub</Link>
      </div>
      <UserButton />
    </nav>
  )
}

export default Navbar
