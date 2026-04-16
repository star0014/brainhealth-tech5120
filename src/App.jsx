// Root component. Sets up the router and defines all page routes.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import ArticleHub from './pages/ArticleHub'
import { getSnapshot, hasCompletedOnboarding } from './utils/recommendations'

function RequireCompletedOnboarding({ children }) {
  const snapshot = getSnapshot()
  const isCompleted = hasCompletedOnboarding(snapshot)

  if (!isCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      {/* Navbar is always visible across all pages */}
      <Navbar />
      <Routes>
        {/* Redirect the root path to the onboarding questionnaire */}
        <Route path="/" element={<Navigate to="/onboarding" />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/dashboard"
          element={(
            <RequireCompletedOnboarding>
              <Dashboard />
            </RequireCompletedOnboarding>
          )}
        />
        <Route
          path="/articles"
          element={(
            <RequireCompletedOnboarding>
              <ArticleHub />
            </RequireCompletedOnboarding>
          )}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
