// ─────────────────────────────────────────────────────────────────────────────
// GuestBanner component — a persistent top-of-page notice shown to guest users.
//
// Purpose:
//   Reminds the user that they are browsing as a guest and that their data
//   (habits, scores) is stored only in this browser's localStorage.
//   Provides a one-click Sign Up shortcut to convert to a full Clerk account,
//   which will trigger the migration flow in HandleAuthTransition (App.jsx).
//
// Render behaviour:
//   Returns null immediately if the current session is not a guest session,
//   so the component is safe to include on every authenticated page layout
//   without conditional rendering at the call site.
// ─────────────────────────────────────────────────────────────────────────────
import { SignUpButton } from '@clerk/clerk-react'
import './GuestBanner.css'

function GuestBanner() {
  // Check the guest flag; if not set, render nothing.
  const isGuest = localStorage.getItem('bb_is_guest') === 'true'
  if (!isGuest) return null

  return (
    <div className="guest-banner">
      {/* Informational text explaining the limitation of guest mode */}
      <span>You are browsing as a guest. Your data is saved on this device only.</span>
      {/* Clerk's SignUpButton opens the sign-up modal without navigating away.
          After sign-up, HandleAuthTransition in App.jsx detects the new Clerk session
          and automatically migrates localStorage habits to the user's database account. */}
      <SignUpButton mode="modal">
        <button className="guest-banner-btn">Sign up to save across devices</button>
      </SignUpButton>
    </div>
  )
}

export default GuestBanner
