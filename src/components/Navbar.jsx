import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const location = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-logo">Brain<span>Boost</span></div>
      <div className="navbar-tabs">
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
      <div className="navbar-avatar">AR</div>
    </nav>
  )
}

export default Navbar