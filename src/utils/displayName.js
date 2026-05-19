// ─────────────────────────────────────────────────────────────────────────────
// displayName.js — generates and persists display names for the leaderboard.
//
// Strategy: store names per identity so they never change:
//   - Signed-in users: key = "bb_display_name_<clerkUserId>"
//   - Guests:          key = "bb_display_name_guest"
//
// This means:
//   - Same Clerk account → always same name, across logouts/logins
//   - Same browser guest session → always same name
//   - Different account on same browser → different name
// ─────────────────────────────────────────────────────────────────────────────

const ADJECTIVES = [
  'Cosmic', 'Turbo', 'Neon', 'Speedy', 'Crispy', 'Zesty', 'Rogue', 'Hyper',
  'Stealth', 'Fuzzy', 'Spicy', 'Mighty', 'Cheeky', 'Snappy', 'Blazing',
  'Jolly', 'Savage', 'Sneaky', 'Groovy', 'Funky', 'Zippy', 'Dizzy', 'Wacky',
  'Bouncy', 'Goofy', 'Salty', 'Peppy', 'Witty', 'Quirky', 'Zany', 'Brave',
  'Chill', 'Slick', 'Fluffy', 'Grumpy', 'Silky', 'Lucky', 'Plucky',
  'Sunny', 'Stormy', 'Frosty', 'Lively', 'Rapid', 'Swift', 'Keen', 'Bold',
  'Sharp', 'Fancy', 'Sassy',
]

const ANIMALS = [
  'Quokka', 'Koala', 'Platypus', 'Wombat', 'Dingo', 'Bilby', 'Echidna',
  'Panda', 'Capybara', 'Axolotl', 'Meerkat', 'Narwhal', 'Fennec', 'Sloth',
  'Pangolin', 'Okapi', 'Tapir', 'Binturong', 'Quoll', 'Numbat', 'Potoroo',
  'Wallaby', 'Possum', 'Bandicoot', 'Cassowary', 'Kookaburra', 'Lorikeet',
  'Galah', 'Dugong', 'Tanuki', 'Quetzal', 'Fossa', 'Aye-aye', 'Tarsier',
  'Caracal', 'Serval', 'Margay', 'Ocelot', 'Kinkajou', 'Coati',
  'Vicuna', 'Alpaca', 'Guanaco', 'Viscacha', 'Chinchilla', 'Degu',
  'Caiman', 'Tamarin',
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomNumber() { return Math.floor(Math.random() * 9000) + 1000 }

function generateRandomName() {
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)} #${randomNumber()}`
}

// Get or create display name for a GUEST session.
// Uses a stable key so the name never changes on the same browser.
export function getOrCreateDisplayName() {
  const key = 'bb_display_name_guest'
  const stored = localStorage.getItem(key)
  if (stored) return stored
  const name = generateRandomName()
  localStorage.setItem(key, name)
  return name
}

// Get or create display name for a SIGNED-IN user.
// Keyed by Clerk user ID so:
//   - Same account → always same name
//   - Different account on same browser → different name
// firstName is used as the prefix instead of a random animal.
export function getOrCreateUserDisplayName(userId, firstName) {
  const key = `bb_display_name_${userId}`
  const stored = localStorage.getItem(key)
  if (stored) return stored
  const num = randomNumber()
  const name = firstName ? `${firstName} #${num}` : generateRandomName()
  localStorage.setItem(key, name)
  return name
}

// Returns the current display name regardless of session type.
// Pass userId + firstName for signed-in users, nothing for guests.
export function getDisplayName(userId, firstName) {
  if (userId) return getOrCreateUserDisplayName(userId, firstName)
  return getOrCreateDisplayName()
}
