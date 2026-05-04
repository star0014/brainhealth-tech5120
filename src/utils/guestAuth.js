export function getOrCreateGuestId() {
  let guestId = localStorage.getItem('bb_guest_id')
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('bb_guest_id', guestId)
  }
  return guestId
}

export function isGuest() {
  return localStorage.getItem('bb_is_guest') === 'true'
}

export function clearGuestSession() {
  localStorage.removeItem('bb_guest_id')
  localStorage.removeItem('bb_is_guest')
}
