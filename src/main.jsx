// ─────────────────────────────────────────────────────────────────────────────
// Application entry point — executed by Vite when the browser loads index.html.
//
// Responsibilities:
//   1. Read the Clerk publishable key from the build-time environment.
//   2. Wrap the entire React tree with StrictMode (extra dev warnings).
//   3. Wrap the tree with ClerkProvider so all components can access auth hooks.
//   4. Mount the root App component into the #root <div> in index.html.
// ─────────────────────────────────────────────────────────────────────────────
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

// The Clerk publishable key identifies this frontend project in the Clerk dashboard.
// It is safe to expose in browser code — it cannot be used to perform privileged actions.
// Vite exposes env variables prefixed with VITE_ via import.meta.env at build time.
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// createRoot: React 18 concurrent-mode API — replaces the legacy ReactDOM.render().
// document.getElementById('root') targets the <div id="root"> in public/index.html.
createRoot(document.getElementById('root')).render(
  // StrictMode: in development only, React double-invokes render and lifecycle functions
  // to surface unintended side effects. Has no effect in production builds.
  <StrictMode>
    {/* ClerkProvider: initialises the Clerk SDK and exposes useUser, useAuth, SignedIn,
        SignedOut, etc. to every component in the tree. Without this wrapper,
        any call to a Clerk hook would throw. */}
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
