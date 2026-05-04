// ─────────────────────────────────────────────────────────────────────────────
// MilestoneBanner component — a temporary celebration banner shown when the user
// unlocks a new check-in milestone (1, 3, 7, or 30 days).
//
// Props:
//   milestone — the milestone object: { days, label, desc, color }
//               null when no milestone has just been unlocked.
//   onClose   — callback invoked when the user clicks ×, or after 5 seconds.
//
// Auto-dismiss:
//   A 5-second timer is set via useEffect. The timer is cleared if the component
//   unmounts before it fires (e.g. the user navigates away), preventing memory leaks.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import './MilestoneBanner.css'

function MilestoneBanner({ milestone, onClose }) {
  // Auto-dismiss after 5 000 ms.
  // The cleanup function cancels the timer if the banner is closed manually first,
  // preventing onClose from being called twice.
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [])

  // Render nothing if no milestone has just been unlocked.
  if (!milestone) return null

  return (
    <div className="milestone-banner">
      {/* Trophy icon — white stroke on the banner's coloured background */}
      <div className="milestone-banner-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
        </svg>
      </div>
      {/* Milestone label and description text */}
      <div className="milestone-banner-text">
        <strong>Milestone Unlocked!</strong>
        <span>{milestone.label} — {milestone.desc}</span>
      </div>
      {/* Manual close button — calls the same onClose prop as the auto-dismiss timer */}
      <button className="milestone-banner-close" onClick={onClose}>×</button>
    </div>
  )
}

export default MilestoneBanner
