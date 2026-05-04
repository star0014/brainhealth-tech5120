// ─────────────────────────────────────────────────────────────────────────────
// ProjectLogin page — the project-level access gate for BrainBoost.
//
// This is a lightweight demo gate separate from Clerk authentication.
// It restricts access to the app during the FIT5120 assessment period.
// Credentials: username = 'user', password = '111111' (intentionally simple for assessors).
//
// Flow:
//   1. If the user already has project access (bb_project_auth = 'true' in sessionStorage),
//      redirect them immediately to their intended destination (or / as fallback).
//   2. Otherwise, show the login form.
//   3. On successful credential entry, set the flag in sessionStorage and navigate.
//   4. On failure, show an error message.
//
// sessionStorage is used so the gate resets when the browser tab is closed.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { hasProjectAccess, PROJECT_AUTH_KEY } from '../utils/projectAuth'
import './ProjectLogin.css'

function ProjectLogin() {
  // Controlled form state for the username and password fields
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')  // set on failed login attempt

  const navigate  = useNavigate()
  const location  = useLocation()

  // location.state?.from is set by RequireProjectAccess in App.jsx when it redirects here.
  // After successful login, the user is sent back to where they originally wanted to go.
  const from = location.state?.from?.pathname || '/'

  // If the user already has project access (e.g. they navigated directly to /login
  // but have already logged in), redirect them away immediately.
  if (hasProjectAccess()) {
    return <Navigate to={from} replace />
  }

  // handleSubmit: validates the hardcoded credentials and sets the session flag on success.
  function handleSubmit(event) {
    event.preventDefault()  // prevent browser from refreshing the page on form submit

    // Credential check: username must be 'user' (trimmed) and password must be '111111'.
    if (username.trim() === 'user' && password === '111111') {
      // Write the access flag to sessionStorage so RequireProjectAccess passes on reload.
      sessionStorage.setItem(PROJECT_AUTH_KEY, 'true')
      navigate(from, { replace: true })  // replace: true prevents the login page appearing in Back history
      return
    }

    setError('Incorrect username or password.')
  }

  return (
    <main className="project-login-page">
      {/* Animated aurora background blobs */}
      <div className="login-aurora login-aurora-one" />
      <div className="login-aurora login-aurora-two" />
      <div className="login-aurora login-aurora-three" />
      {/* Subtle grid overlay for texture */}
      <div className="login-grid" />

      <section className="project-login-shell" aria-label="BrainBoost project login">
        {/* Brand mark at the top of the login card */}
        <div className="project-login-brand">
          <span className="brand-mark" aria-hidden="true">BB</span>
          <span>Brain<span>Boost</span></span>
        </div>

        {/* Login form — onSubmit handles both button click and Enter key press */}
        <form className="project-login-card" onSubmit={handleSubmit}>
          <div className="card-accent" />
          <p className="login-kicker">Project access</p>
          <h1>Welcome back</h1>
          <p className="login-copy">Sign in to continue to BrainBoost.</p>

          {/* Username field — autoComplete="username" helps password managers */}
          <label className="login-field">
            <span>Username</span>
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setError('')  // clear error message as soon as the user starts typing
              }}
              placeholder="Enter username"
            />
          </label>

          {/* Password field — type="password" masks the input */}
          <label className="login-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')  // clear error on change so it doesn't linger
              }}
              placeholder="Enter password"
            />
          </label>

          {/* Error message — only rendered when the login attempt failed.
              role="alert" causes screen readers to announce it immediately. */}
          {error && <div className="login-error" role="alert">{error}</div>}

          <button className="project-login-button" type="submit">Sign In</button>
        </form>

        <p className="login-footnote">BrainBoost - Brain Health Platform - FIT5120</p>
      </section>
    </main>
  )
}

export default ProjectLogin
