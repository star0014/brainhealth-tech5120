import { SignUpButton } from '@clerk/clerk-react'
import './GuestBanner.css'

function GuestBanner() {
  const isGuest = localStorage.getItem('bb_is_guest') === 'true'
  if (!isGuest) return null

  return (
    <div className="guest-banner">
      <span>You are browsing as a guest. Your data is saved on this device only.</span>
      <SignUpButton mode="modal">
        <button className="guest-banner-btn">Sign up to save across devices</button>
      </SignUpButton>
    </div>
  )
}

export default GuestBanner
