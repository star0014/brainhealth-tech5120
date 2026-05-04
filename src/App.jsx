// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — root routing component for BrainBoost.
//
// Responsibilities:
//   1. Define all client-side routes using React Router v7.
//   2. Guard routes with layered access-control wrappers:
//        RequireProjectAccess — gates the entire app behind the project login screen.
//        RequireAuth          — requires a Clerk account OR an active guest session.
//        RequireCompletedOnboarding — redirects to /onboarding if the snapshot is missing.
//   3. Run HandleAuthTransition once after a guest signs up, migrating localStorage
//      habits to the user's database account.
// ─────────────────────────────────────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, useUser, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import GuestBanner from './components/GuestBanner'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import ArticleHub from './pages/ArticleHub'
import HabitTracker from './pages/HabitTracker'
import Progress from './pages/Progress'
import MiniGames from './pages/MiniGames'
import ProjectLogin from './pages/ProjectLogin'
import { hasProjectAccess } from './utils/projectAuth'
import { getSnapshot, hasCompletedOnboarding } from './utils/recommendations'

// ── Utility helpers ───────────────────────────────────────────────────────────

// Returns true if the current session is a guest session (flag set in Home.jsx).
const isGuestUser = () => localStorage.getItem('bb_is_guest') === 'true'

// Returns true if a guest has already completed the onboarding questionnaire.
// Used by OnboardingRoute to skip the questionnaire and redirect straight to /dashboard.
const guestHasOnboarded = () => {
  const snapshot = getSnapshot()
  return hasCompletedOnboarding(snapshot)
}

// Base URL of the backend API.  Falls back to localhost for local development.
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// localStorage key where guest habit check-ins are stored as a JSON array.
const LS_HABITS = 'bb_guest_habits'

// tracks which user ID has already been migrated
const LS_MIGRATED = 'bb_migrated_user'

// ─────────────────────────────────────────────────────────────────────────────
// HandleAuthTransition
// ─────────────────────────────────────────────────────────────────────────────
// Invisible component that runs a one-time effect after a user signs in.
// It detects whether the session was previously a guest session and, if so,
// uploads any stored habits to the API before clearing the guest flag.
//
// Two scenarios:
//   A. Guest had no habits → just clear the guest flag; show the user's cloud history.
//   B. Guest had habits → POST each one to /api/habits, then clear the guest flag and data.
//
// The LS_MIGRATED key records which Clerk user ID has already been processed,
// preventing duplicate uploads if the user signs in again later.
function HandleAuthTransition() {
  const { isSignedIn, user } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    if (!isSignedIn || !user) return

    const userId = user.id
    const alreadyMigrated = localStorage.getItem(LS_MIGRATED) === userId
    const guestHabits = JSON.parse(localStorage.getItem(LS_HABITS) || '[]')

    if (alreadyMigrated) {
      // This user was already migrated — just clear guest flag silently
      localStorage.removeItem('bb_is_guest')
      return
    }

    if (guestHabits.length > 0) {
      // Option B: guest has history → migrate it to their account then wipe
      ;(async () => {
        try {
          const token = await getToken()
          // Post each guest habit to the API
          for (const habit of guestHabits) {
            await fetch(`${API}/habits`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sleep_hours: habit.sleep_hours,
                screen_time: habit.screen_time,
                physical_activity: habit.physical_activity,
                date: habit.date
              })
            })
          }
          // Mark this user as migrated and wipe guest data
          localStorage.setItem(LS_MIGRATED, userId)
          localStorage.removeItem('bb_is_guest')
          localStorage.removeItem(LS_HABITS)
          localStorage.removeItem('bb_total_checkins')
          localStorage.removeItem('bb_guest_id')
        } catch (err) {
          console.error('Migration failed:', err)
          // Still clear guest flag even if migration fails
          localStorage.removeItem('bb_is_guest')
        }
      })()
    } else {
      // Option A: no guest history → just clear guest flag, show account history
      localStorage.removeItem('bb_is_guest')
      localStorage.removeItem('bb_total_checkins')
      localStorage.removeItem('bb_guest_id')
      // Guest habits stay untouched (empty anyway)
    }
  }, [isSignedIn, user?.id])

  return null  // renders nothing — purely a side-effect component
}

// ─────────────────────────────────────────────────────────────────────────────
// Route guard components
// ─────────────────────────────────────────────────────────────────────────────

// RequireAuth: allows access if the user is either signed in via Clerk OR is a guest.
// For signed-in users, uses Clerk's SignedIn/SignedOut components.
// For guests, passes children through directly.
function RequireAuth({ children }) {
  if (isGuestUser()) return children
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  )
}

// RequireProjectAccess: guards every route except /login.
// If the project gate has not been passed (bb_project_auth !== 'true' in sessionStorage),
// the user is redirected to /login. The `from` location is passed as state so they
// return to the original destination after authenticating.
function RequireProjectAccess({ children }) {
  const location = useLocation()

  if (!hasProjectAccess()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

// RequireCompletedOnboarding: redirects to /onboarding if the user has not yet
// completed the questionnaire. Applied to pages that depend on a stored snapshot
// (Dashboard, ArticleHub). Not applied to /habits, /games, or /progress.
function RequireCompletedOnboarding({ children }) {
  const { isSignedIn } = useUser()
  const snapshot = getSnapshot()
  const isCompleted = hasCompletedOnboarding(snapshot)
  if (!isCompleted && !isSignedIn && !isGuestUser()) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

// Guests who've already completed onboarding get redirected to dashboard
// so they don't have to re-answer the questionnaire on every page load.
function OnboardingRoute() {
  if (isGuestUser() && guestHasOnboarded()) {
    return <Navigate to="/dashboard" replace />
  }
  return <><Navbar /><GuestBanner /><Onboarding /></>
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
// Root component. Wraps all routes in BrowserRouter.
// HandleAuthTransition is rendered at the top level so it runs on every page.
//
// Route nesting follows the pattern:
//   RequireProjectAccess > RequireAuth > Navbar + GuestBanner > RequireCompletedOnboarding > Page
//
// Notes:
//   - /games is intentionally not wrapped in RequireAuth (guests can play without onboarding).
//   - /habits and /progress are accessible without completed onboarding.
export default function App() {
  return (
    <BrowserRouter>
      {/* HandleAuthTransition: invisible component that handles guest→user migration */}
      <HandleAuthTransition />
      <Routes>
        {/* /login: the project gate page — no guards wrap it */}
        <Route path="/login" element={<ProjectLogin />} />

        {/* / : landing / home page */}
        <Route path="/" element={<RequireProjectAccess><Home /></RequireProjectAccess>} />

        {/* /onboarding : 4-question brain health questionnaire */}
        <Route path="/onboarding" element={<RequireProjectAccess><OnboardingRoute /></RequireProjectAccess>} />

        {/* /dashboard : main results screen — requires completed onboarding */}
        <Route path="/dashboard" element={<RequireProjectAccess><RequireAuth><Navbar /><GuestBanner /><RequireCompletedOnboarding><Dashboard /></RequireCompletedOnboarding></RequireAuth></RequireProjectAccess>} />

        {/* /habits : daily check-in and habit history */}
        <Route path="/habits"    element={<RequireProjectAccess><RequireAuth><Navbar /><GuestBanner /><HabitTracker /></RequireAuth></RequireProjectAccess>} />

        {/* /progress : streak, milestones, and game history */}
        <Route path="/progress"  element={<RequireProjectAccess><RequireAuth><Navbar /><GuestBanner /><Progress /></RequireAuth></RequireProjectAccess>} />

        {/* /games : mini games hub — open to all (no RequireAuth) */}
        <Route path="/games"     element={<RequireProjectAccess><Navbar /><GuestBanner /><MiniGames /></RequireProjectAccess>} />

        {/* /articles : article hub — requires completed onboarding for personalised picks */}
        <Route path="/articles"  element={<RequireProjectAccess><RequireAuth><Navbar /><GuestBanner /><RequireCompletedOnboarding><ArticleHub /></RequireCompletedOnboarding></RequireAuth></RequireProjectAccess>} />
      </Routes>
    </BrowserRouter>
  )
}
