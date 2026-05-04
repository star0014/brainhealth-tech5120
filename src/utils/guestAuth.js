// ─────────────────────────────────────────────────────────────────────────────
// Guest authentication utilities for BrainBoost.
//
// BrainBoost allows unauthenticated users to explore the full app as "guests".
// Guest state is tracked entirely in localStorage — no server-side session is created.
// When a guest later creates a Clerk account, App.jsx migrates their habit data
// to the database and then clears the guest flag.
//
// localStorage keys used:
//   'bb_guest_id'  — the randomly-generated stable identifier for this guest session
//   'bb_is_guest'  — 'true' while the session is in guest mode
// ─────────────────────────────────────────────────────────────────────────────

// Returns the stored guest ID, creating and persisting a new random one if none exists.
// The ID is composed of two base-36 random substrings joined together.
// It is prefixed with 'guest_' so the backend auth middleware can distinguish it
// from real Clerk user IDs (which start with 'user_').
export function getOrCreateGuestId() {
  let guestId = localStorage.getItem('bb_guest_id')
  if (!guestId) {
    // Math.random().toString(36).substring(2, 15) produces a 13-character alphanumeric string.
    // Concatenating two of them gives a 26-character ID — low collision probability for a demo app.
    guestId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('bb_guest_id', guestId)
  }
  return guestId
}

// Returns true if the current browser session is in guest mode.
// Checked by multiple components (Navbar, GuestBanner, HabitTracker, etc.)
// to conditionally show guest-specific UI and use localStorage instead of the API.
export function isGuest() {
  return localStorage.getItem('bb_is_guest') === 'true'
}

// Clears the guest identity from localStorage.
// Called during the post-sign-up migration flow in App.jsx (HandleAuthTransition)
// after guest habit data has been copied to the user's account in the database.
export function clearGuestSession() {
  localStorage.removeItem('bb_guest_id')
  localStorage.removeItem('bb_is_guest')
}
