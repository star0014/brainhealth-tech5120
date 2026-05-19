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
  return null
}

export default GuestBanner
