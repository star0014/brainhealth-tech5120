import { useEffect, useState } from 'react'
import './MilestoneBanner.css'

function MilestoneBanner({ milestone, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!milestone) return null

  return (
    <div className="milestone-banner">
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
      <div className="milestone-banner-text">
        <strong>Milestone Unlocked!</strong>
        <span>{milestone.label} — {milestone.desc}</span>
      </div>
      <button className="milestone-banner-close" onClick={onClose}>×</button>
    </div>
  )
}

export default MilestoneBanner
