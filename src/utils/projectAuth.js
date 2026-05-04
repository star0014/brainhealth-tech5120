// ─────────────────────────────────────────────────────────────────────────────
// Project-level access gate for BrainBoost.
//
// The app sits behind a simple username/password gate (separate from Clerk auth)
// to restrict public access during the FIT5120 assessment period.
// This is a lightweight demo gate — credentials are intentionally simple ('user' / '111111').
//
// sessionStorage is used intentionally: the gate resets when the browser tab is closed,
// but persists across page navigations within the same tab. This avoids forcing
// re-authentication on every page load while still keeping the gate meaningful.
// ─────────────────────────────────────────────────────────────────────────────

// Key used to store the project access flag in sessionStorage.
// Exported so ProjectLogin.jsx can set it using the same key reference.
export const PROJECT_AUTH_KEY = 'bb_project_auth'

// Returns true if the user has already passed the project login screen in this browser session.
// Used by RequireProjectAccess in App.jsx to guard every route.
// The value 'true' is written to sessionStorage by ProjectLogin.jsx on successful login.
export function hasProjectAccess() {
  return sessionStorage.getItem(PROJECT_AUTH_KEY) === 'true'
}
