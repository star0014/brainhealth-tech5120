// Top navigation bar shown on every page.
// Highlights the active tab based on the current URL path.
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  // useLocation gives us the current URL so we can mark the right tab as active
  const location = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-logo">Brain<span>Boost</span></div>
      <div className="navbar-tabs">
        {/* Each tab compares the current path to decide whether to add the 'active' class */}
        <Link to="/onboarding" className={`nav-tab ${location.pathname === '/onboarding' ? 'active' : ''}`}>
          Onboarding
        </Link>
        <Link to="/dashboard" className={`nav-tab ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          Dashboard
        </Link>
        <Link to="/articles" className={`nav-tab ${location.pathname === '/articles' ? 'active' : ''}`}>
          Article Hub
        </Link>
      </div>
      {/* Placeholder avatar — will be replaced with real user info in future iterations */}
      <div className="navbar-avatar">AR</div>
    </nav>
  )
}

export default Navbar