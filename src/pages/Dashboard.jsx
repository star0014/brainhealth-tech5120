// Dashboard page — the main results screen shown after onboarding.
// Reads the snapshot from router state or localStorage, then renders the brain pet,
// domain score cards, priority alerts, standout summary, article picks, and benchmark charts.
import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import './Dashboard.css'
import { ARTICLES } from '../data/articles'
import { getRecommendedArticles } from '../utils/recommendations'
import SleepDurationChart from '../components/SleepDurationChart'
import PhysicalActivityChart from '../components/PhysicalActivityChart'
import { calculateSnapshotFromResponses } from '../utils/scoring'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// Emoji icons displayed next to each domain score bar
const DOMAIN_ICONS = {
  sleep_rhythm:     '🌙',
  move_mode:        '🏃',
  cognitive_strain: '🧠',
  social_energy:    '🤝',
}

// Reference average sleep hours for the 18-24 age group (used in the standout card)
const SLEEP_AVERAGE_18_24 = { overall: 7.6, weeknight: 7.51, weekend: 7.59 }

// Maps Q1 answer codes (1-5) to a sleep band object used by SleepDurationChart
const SLEEP_BANDS = {
  1: { code: 1, label: 'less than 6 hours',        midpoint: 5.5, share: 9.5  },
  2: { code: 2, label: '6 to less than 7 hours',   midpoint: 6.5, share: 18.0 },
  3: { code: 3, label: '7 to less than 8 hours',   midpoint: 7.5, share: 31.0 },
  4: { code: 4, label: '8 to less than 9 hours',   midpoint: 8.5, share: 35.8 },
  5: { code: 5, label: '9 hours or more',           midpoint: 9.6, share: 5.6  },
}

// Maps Q2 answer codes (1-5) to an activity band object used by PhysicalActivityChart
const ACTIVITY_BANDS = {
  1: { key: 'lt30',    label: 'Less than 30 minutes a day' },
  2: { key: '30to60',  label: 'About 30 minutes to less than 1 hour a day' },
  3: { key: '1to1_5',  label: 'About 1 to less than 1.5 hours a day' },
  4: { key: '1_5to2',  label: 'About 1.5 to less than 2 hours a day' },
  5: { key: '2to2_5',  label: 'About 2 to less than 2.5 hours a day' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Pet configuration
// ─────────────────────────────────────────────────────────────────────────────
const PET_STATES = {
  ecstatic: {
    bodyColor: '#3DC99A',
    glowColor: 'rgba(61,201,154,0.45)',
    eyeType:   'star',
    mouthType: 'bigSmile',
    animClass: 'pet-anim-bounce',
    extras:    'sparkles',
    label:     '✨ Thriving!',
    badgeClass:'badge-ecstatic',
  },
  happy: {
    bodyColor: '#5DC9A5',
    glowColor: 'rgba(93,201,165,0.35)',
    eyeType:   'happy',
    mouthType: 'smile',
    animClass: 'pet-anim-bounce',
    extras:    'hearts',
    label:     '😊 Happy',
    badgeClass:'badge-happy',
  },
  content: {
    bodyColor: '#4A9EDB',
    glowColor: 'rgba(74,158,219,0.3)',
    eyeType:   'normal',
    mouthType: 'neutralSmile',
    animClass: 'pet-anim-sway',
    extras:    null,
    label:     '😐 Okay',
    badgeClass:'badge-content',
  },
  tired: {
    bodyColor: '#7BAACF',
    glowColor: 'rgba(123,170,207,0.3)',
    eyeType:   'sleepy',
    mouthType: 'yawn',
    animClass: 'pet-anim-slow',
    extras:    'zzz',
    label:     '😴 Tired',
    badgeClass:'badge-tired',
  },
  stressed: {
    bodyColor: '#EF9F27',
    glowColor: 'rgba(239,159,39,0.35)',
    eyeType:   'worried',
    mouthType: 'anxious',
    animClass: 'pet-anim-jitter',
    extras:    'sweat',
    label:     '😰 Stressed',
    badgeClass:'badge-stressed',
  },
  sad: {
    bodyColor: '#8BA8C4',
    glowColor: 'rgba(139,168,196,0.3)',
    eyeType:   'sad',
    mouthType: 'frown',
    animClass: 'pet-anim-sad',
    extras:    'tears',
    label:     '😢 Feeling down',
    badgeClass:'badge-sad',
  },
}

const PET_STAT_META = {
  sleep_rhythm:     { label: 'Rest',   icon: '💤' },
  move_mode:        { label: 'Energy', icon: '⚡' },
  cognitive_strain: { label: 'Focus',  icon: '🧠' },
  social_energy:    { label: 'Social', icon: '💬' },
}

const POKE_MESSAGES_HAPPY = [
  "Hehe, that tickles! 😆",
  "Do it again! 🎉",
  "I feel the love! 💖",
  "You're the best! 🌟",
  "Wheee! 🎊",
]

const POKE_MESSAGES_SAD = [
  "I needed that hug... thank you. 🥹",
  "That means a lot to me. 💙",
  "I'll get better soon, with your help. 🌱",
  "Don't give up on me. 🫂",
]

// Determines which mood state the pet should be in based on the overall score
// and the lowest-scoring domain. Domain details refine the mood within a score tier.
function getPetState(snapshot) {
  const score = snapshot.overallScore
  const get   = (key) => snapshot.domainScores.find(d => d.key === key)?.score ?? 50
  if (score >= 88) return 'ecstatic'
  if (score >= 72) return 'happy'
  if (score >= 55) {
    if (get('sleep_rhythm')     < 50) return 'tired'
    if (get('cognitive_strain') < 50) return 'stressed'
    return 'content'
  }
  if (score >= 38) {
    if (get('cognitive_strain') < 42) return 'stressed'
    return 'tired'
  }
  return 'sad'
}

// Returns the pet's speech bubble text, personalised by score tier and weakest domain
function getPetSpeech(snapshot) {
  const { overallScore, domainScores } = snapshot
  const get = (key) => domainScores.find(d => d.key === key)?.score ?? 50
  if (overallScore >= 88)
    return "I'm absolutely THRIVING right now! 🌟 You've been taking such great care of me — keep it up!"
  if (overallScore >= 72) {
    if (get('sleep_rhythm') < 65) return "Feeling pretty good, but a little sleepy... 😪 Could we get a bit more rest tonight?"
    if (get('move_mode')    < 65) return "Happy today! 😊 Though my legs could use some stretching — let's get moving!"
    return "Life is good! 😊 Your habits are really paying off — keep this going!"
  }
  if (overallScore >= 55) {
    if (get('sleep_rhythm')     < 50) return "Yaaawn... running on low batteries today. 😴 My rest score is dragging me down..."
    if (get('cognitive_strain') < 50) return "My thoughts are all tangled up... 🌀 Too much going on. I need a mental break."
    if (get('social_energy')    < 50) return "Feeling a little isolated in here... 🥺 Could we connect with someone today?"
    return "Doing okay, but there's room to grow! 🤔 Which area should we focus on first?"
  }
  if (overallScore >= 38) {
    if (get('cognitive_strain') < 42) return "Everything feels overwhelming right now... 😰 Please help me slow down and breathe."
    if (get('sleep_rhythm')     < 42) return "Can't... keep... eyes... open... 😴 I really, really need more sleep. Please."
    return "I'm struggling a bit today... 😓 But I know we can turn this around together!"
  }
  return "I'm not feeling well at all... 😢 My scores are really suffering. Please take better care of me."
}

// Returns the label text for the poke button, adjusted for the pet's current mood
function getPokeLabel(petState) {
  if (petState === 'sad')      return '🫂 Give a hug'
  if (petState === 'tired')    return '☕ Wake me up!'
  if (petState === 'stressed') return '😌 Calm me down'
  return '👆 Poke me!'
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

// Returns a CSS tone class ('good' | 'warn' | 'bad') based on a domain score
function statusTone(score) {
  if (score >= 75) return 'good'
  if (score >= 50) return 'warn'
  return 'bad'
}

// Returns a short status label shown next to each domain score bar
function statusCopy(score) {
  if (score >= 75) return 'Locked in'
  if (score >= 50) return 'In progress'
  return 'Needs attention'
}

// ─────────────────────────────────────────────────────────────────────────────
// Neural particle background
// ─────────────────────────────────────────────────────────────────────────────
// Renders an animated canvas with floating dots connected by lines when they get close.
// Re-initialises on window resize to always fill the viewport.
function NeuralBackground() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    // Creates 55 particles scattered randomly across the canvas
    const init = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      particles = Array.from({ length: 55 }, () => ({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.45,  // slow horizontal drift
        vy: (Math.random() - 0.5) * 0.45,  // slow vertical drift
        r:  Math.random() * 1.8 + 0.5,     // radius between 0.5 and 2.3
        a:  Math.random() * 0.45 + 0.15,   // opacity between 0.15 and 0.6
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy
        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74,158,219,${p.a})`
        ctx.fill()
        // Draw a faint line to every nearby particle
        for (let j = i + 1; j < particles.length; j++) {
          const q    = particles[j]
          const dist = Math.hypot(p.x - q.x, p.y - q.y)
          if (dist < 140) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
            // Line fades out as distance increases
            ctx.strokeStyle = `rgba(74,158,219,${0.13 * (1 - dist / 140)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }

    init()
    window.addEventListener('resize', init)
    draw()
    // Clean up animation loop and event listener when component unmounts
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', init) }
  }, [])
  return <canvas ref={canvasRef} className="neural-canvas" />
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated score counter — counts up from 0 to target using a cubic ease-out curve
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedScore({ target, duration = 1800 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * target)) // cubic ease-out
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return val
}

// ─────────────────────────────────────────────────────────────────────────────
// 3-D tilt handlers — attach to cards via spread: <div {...tilt}>
// Tilts the card toward the mouse cursor, creating a subtle 3D effect.
// ─────────────────────────────────────────────────────────────────────────────
function makeTiltHandlers(strength = 10) {
  return {
    onMouseMove(e) {
      const el = e.currentTarget
      const { left, top, width, height } = el.getBoundingClientRect()
      // Calculate rotation based on how far the cursor is from the card centre
      const rotY = ((e.clientX - left - width  / 2) / (width  / 2)) * strength
      const rotX = -((e.clientY - top  - height / 2) / (height / 2)) * strength
      el.style.transform  = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`
      el.style.transition = 'transform 0.05s linear'
      el.style.zIndex     = '2'
    },
    onMouseLeave(e) {
      const el = e.currentTarget
      el.style.transform  = ''
      el.style.transition = 'transform 0.55s cubic-bezier(0.4,0,0.2,1)'
      el.style.zIndex     = ''
    },
  }
}

const tilt = makeTiltHandlers(10)

// ─────────────────────────────────────────────────────────────────────────────
// BrainPet SVG — 6 moods, fully animated
// ─────────────────────────────────────────────────────────────────────────────
function renderEyes(type, bodyColor) {
  switch (type) {
    case 'star':
      return (
        <>
          <text x="77"  y="100" fontSize="22" textAnchor="middle" dominantBaseline="middle" style={{ userSelect: 'none' }}>✦</text>
          <text x="123" y="100" fontSize="22" textAnchor="middle" dominantBaseline="middle" style={{ userSelect: 'none' }}>✦</text>
        </>
      )
    case 'happy':
      return (
        <>
          <path d="M 63 93 Q 77 81 91 93"   stroke="#1A2E28" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M 109 93 Q 123 81 137 93" stroke="#1A2E28" strokeWidth="4" fill="none" strokeLinecap="round"/>
        </>
      )
    case 'normal':
      return (
        <>
          <circle cx="77"  cy="96" r="10" fill="#1A2E28"/>
          <circle cx="123" cy="96" r="10" fill="#1A2E28"/>
          <circle cx="80"  cy="93" r="3.5" fill="white"/>
          <circle cx="126" cy="93" r="3.5" fill="white"/>
        </>
      )
    case 'sleepy':
      return (
        <>
          <ellipse cx="77"  cy="99" rx="10" ry="7" fill="#1A2E28"/>
          <rect x="67"  y="92" width="20" height="7.5" fill={bodyColor}/>
          <ellipse cx="123" cy="99" rx="10" ry="7" fill="#1A2E28"/>
          <rect x="113" y="92" width="20" height="7.5" fill={bodyColor}/>
          <circle cx="80"  cy="97" r="2.5" fill="rgba(255,255,255,0.7)"/>
          <circle cx="126" cy="97" r="2.5" fill="rgba(255,255,255,0.7)"/>
        </>
      )
    case 'worried':
      return (
        <>
          <circle cx="77"  cy="97" r="10" fill="#1A2E28"/>
          <circle cx="123" cy="97" r="10" fill="#1A2E28"/>
          <circle cx="80"  cy="94" r="3.5" fill="white"/>
          <circle cx="126" cy="94" r="3.5" fill="white"/>
          <path d="M 63 84 L 77 89 L 91 84"   stroke="#1A2E28" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
          <path d="M 109 84 L 123 89 L 137 84" stroke="#1A2E28" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
        </>
      )
    case 'sad':
      return (
        <>
          <circle cx="77"  cy="97" r="10" fill="#1A2E28"/>
          <circle cx="123" cy="97" r="10" fill="#1A2E28"/>
          <circle cx="80"  cy="94" r="3.5" fill="white"/>
          <circle cx="126" cy="94" r="3.5" fill="white"/>
          <path d="M 63 88 Q 77 84 91 90"    stroke="#1A2E28" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 109 90 Q 123 84 137 88"  stroke="#1A2E28" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </>
      )
    default: return null
  }
}

function renderMouth(type) {
  switch (type) {
    case 'bigSmile':
      return <path d="M 62 121 Q 100 150 138 121" stroke="#1A2E28" strokeWidth="4" fill="none" strokeLinecap="round"/>
    case 'smile':
      return <path d="M 68 121 Q 100 140 132 121" stroke="#1A2E28" strokeWidth="4" fill="none" strokeLinecap="round"/>
    case 'neutralSmile':
      return <path d="M 75 121 Q 100 131 125 121" stroke="#1A2E28" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    case 'yawn':
      return (
        <>
          <ellipse cx="100" cy="126" rx="18" ry="13" fill="#1A2E28"/>
          <ellipse cx="100" cy="128" rx="13" ry="9"  fill="#E8607A"/>
          <ellipse cx="100" cy="135" rx="8"  ry="4"  fill="#C0485C"/>
        </>
      )
    case 'anxious':
      return (
        <path d="M 70 123 Q 80 133 90 123 Q 100 113 110 123 Q 120 133 130 123"
          stroke="#1A2E28" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      )
    case 'frown':
      return <path d="M 68 134 Q 100 116 132 134" stroke="#1A2E28" strokeWidth="4" fill="none" strokeLinecap="round"/>
    default: return null
  }
}

function renderExtras(type) {
  switch (type) {
    case 'sparkles':
      return (
        <>
          <text x="20"  y="60"  fontSize="18" opacity="0.9"  className="pet-sparkle pet-sp1" style={{ userSelect:'none' }}>✦</text>
          <text x="170" y="48"  fontSize="13" opacity="0.75" className="pet-sparkle pet-sp2" style={{ userSelect:'none' }}>★</text>
          <text x="175" y="85"  fontSize="16" opacity="0.85" className="pet-sparkle pet-sp3" style={{ userSelect:'none' }}>✦</text>
          <text x="14"  y="90"  fontSize="11" opacity="0.6"  className="pet-sparkle pet-sp4" style={{ userSelect:'none' }}>★</text>
        </>
      )
    case 'hearts':
      return (
        <>
          <text x="18"  y="65"  fontSize="18" opacity="0.85" className="pet-float pet-fl1" style={{ userSelect:'none' }}>💖</text>
          <text x="168" y="55"  fontSize="15" opacity="0.7"  className="pet-float pet-fl2" style={{ userSelect:'none' }}>💗</text>
        </>
      )
    case 'zzz':
      return (
        <>
          <text x="150" y="68"  fontSize="18" opacity="0.85" className="pet-zzz pet-z1" fill="#7BAACF" style={{ userSelect:'none' }}>z</text>
          <text x="160" y="48"  fontSize="22" opacity="0.65" className="pet-zzz pet-z2" fill="#7BAACF" style={{ userSelect:'none' }}>Z</text>
          <text x="170" y="26"  fontSize="28" opacity="0.45" className="pet-zzz pet-z3" fill="#7BAACF" style={{ userSelect:'none' }}>Z</text>
        </>
      )
    case 'sweat':
      return (
        <>
          <ellipse cx="150" cy="80" rx="5" ry="7"   fill="#87CEEB" opacity="0.85"/>
          <path    d="M 150 73 L 147 80 A 5 5 0 0 0 153 80 Z" fill="#87CEEB" opacity="0.7"/>
        </>
      )
    case 'tears':
      return (
        <>
          <ellipse cx="77"  cy="114" rx="3.5" ry="6" fill="#87CEEB" opacity="0.9" className="pet-tear pet-t1"/>
          <ellipse cx="123" cy="114" rx="3.5" ry="6" fill="#87CEEB" opacity="0.9" className="pet-tear pet-t2"/>
        </>
      )
    default: return null
  }
}

function BrainPet({ petState, onPoke, isPoking }) {
  const cfg = PET_STATES[petState]
  return (
    <div
      className={`pet-svg-wrap ${isPoking ? 'pet-poke' : cfg.animClass}`}
      onClick={onPoke}
      title="Click to interact!"
    >
      <svg viewBox="0 0 200 200" width="180" height="180" overflow="visible">
        {/* Drop shadow */}
        <ellipse cx="100" cy="182" rx="55" ry="9" fill="rgba(0,0,0,0.10)"/>

        {/* Glow behind body */}
        <ellipse cx="100" cy="108" rx="78" ry="74"
          fill={cfg.glowColor}
          style={{ filter: 'blur(12px)' }}
        />

        {/* Body */}
        <ellipse cx="100" cy="108" rx="72" ry="68" fill={cfg.bodyColor}/>

        {/* Shine highlight */}
        <ellipse cx="76" cy="80" rx="24" ry="15"
          fill="rgba(255,255,255,0.2)"
          transform="rotate(-18 76 80)"
        />

        {/* Eyes */}
        {renderEyes(cfg.eyeType, cfg.bodyColor)}

        {/* Cheeks */}
        <ellipse cx="52"  cy="112" rx="14" ry="8" fill="rgba(255,140,120,0.32)"/>
        <ellipse cx="148" cy="112" rx="14" ry="8" fill="rgba(255,140,120,0.32)"/>

        {/* Mouth */}
        {renderMouth(cfg.mouthType)}

        {/* Extras */}
        {renderExtras(cfg.extras)}
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard() {
  const location = useLocation()

  // Try to read the snapshot from localStorage (persisted after onboarding)
  const storedSnapshot = localStorage.getItem('brainboostSnapshot')
  let parsedSnapshot = null

  if (storedSnapshot) {
    try {
      parsedSnapshot = JSON.parse(storedSnapshot)
    } catch {
      // Ignore malformed data — falls through to null
      parsedSnapshot = null
    }
  }

  // Prefer router state (just came from onboarding) then fall back to localStorage
  const baseSnapshot = location.state ?? parsedSnapshot

  const [dismissedWarnings, setDismissedWarnings] = useState([])  // keys of dismissed alert cards
  const [showHistory,       setShowHistory]        = useState(false) // toggle for dismissed list
  const [isPoking,          setIsPoking]           = useState(false) // prevents rapid repeat pokes
  const [pokeMessage,       setPokeMessage]        = useState(null)  // temporary poke response text

  // If there is no snapshot at all, redirect back to onboarding
  if (!baseSnapshot) return <Navigate to="/onboarding" replace />

  // Re-run scoring from raw responses so the displayed values stay in sync with scoring.js
  const scoringInput     = baseSnapshot.questionnaireResponses ?? baseSnapshot.responses
  const recomputedScoring = calculateSnapshotFromResponses(scoringInput)

  // Merge recomputed scores on top of the base snapshot (overrides any stale cached values)
  const snapshot = recomputedScoring
    ? {
        ...baseSnapshot,
        overallScore:          recomputedScoring.overallScore,
        overallInterpretation: recomputedScoring.overallInterpretation,
        domainScores:          recomputedScoring.domainScoresLegacy,
      }
    : baseSnapshot

  const petState  = getPetState(snapshot)
  const petSpeech = getPetSpeech(snapshot)

  // Triggers the poke animation and picks a random response message
  const handlePoke = () => {
    if (isPoking) return
    setIsPoking(true)
    const pool = snapshot.overallScore < 50 ? POKE_MESSAGES_SAD : POKE_MESSAGES_HAPPY
    setPokeMessage(pool[Math.floor(Math.random() * pool.length)])
    setTimeout(() => setIsPoking(false), 520)   // re-enable after animation
    setTimeout(() => setPokeMessage(null), 2800) // clear speech bubble after a moment
  }

  // Adds a warning card key to the dismissed list so it hides from view
  const dismissWarning = (key) => setDismissedWarnings(prev => [...prev, key])

  // Sort domains high-to-low so strongest[0] and priority[last] are easy to pick
  const sortedDomains       = [...snapshot.domainScores].sort((a, b) => b.score - a.score)
  const strongest           = sortedDomains[0]                       // highest-scoring domain
  const priority            = sortedDomains[sortedDomains.length - 1] // lowest-scoring domain
  const secondaryPriority   = sortedDomains[sortedDomains.length - 2] // second-lowest domain
  const recommendedArticles = getRecommendedArticles(snapshot, ARTICLES, 3)
  // Look up chart band objects from Q1/Q2 answer codes
  const selectedSleepBand     = SLEEP_BANDS[scoringInput?.Q1]
  const selectedActivityBand  = ACTIVITY_BANDS[scoringInput?.Q2 ?? snapshot.responses?.Q4]

  // Format today's date in Australian style, e.g. "Monday, 13 April 2026"
  const today = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  return (
    <div className="dash-wrap">
      <NeuralBackground />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="dash-header">
        <div>
          <div className="dash-greeting">Your latest check-in</div>
          <div className="dash-name">Your Brain Vibe</div>
        </div>
        <div className="dash-date">{today}</div>
      </div>

      {/* ── Pet section ────────────────────────────────────────────────────── */}
      <div className="pet-section">
        <div className="pet-left">
          <BrainPet petState={petState} onPoke={handlePoke} isPoking={isPoking} />
          <button className="pet-poke-btn" onClick={handlePoke}>
            {getPokeLabel(petState)}
          </button>
        </div>

        <div className="pet-right">
          <div className="pet-name-row">
            <div className="pet-name">Brainy</div>
            <div className={`pet-status-badge ${PET_STATES[petState].badgeClass}`}>
              {PET_STATES[petState].label}
            </div>
          </div>
          <div className="pet-speech-bubble">
            <div className="pet-speech-arrow" />
            <span className={`pet-speech-text ${pokeMessage ? 'pet-speech-poke' : ''}`}>
              {pokeMessage ?? petSpeech}
            </span>
          </div>
          <div className="pet-overall-row">
            <span className="pet-overall-label">Overall score</span>
            <span className="pet-overall-score">
              <AnimatedScore target={snapshot.overallScore} /><span className="pet-overall-max">/100</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Pet stats (domain scores) ───────────────────────────────────────── */}
      <div className="section-heading">Brainy's vitals</div>
      <div className="pet-stats-card" {...tilt}>
        {snapshot.domainScores.map((domain) => {
          const meta = PET_STAT_META[domain.key]
          const tone = statusTone(domain.score)
          return (
            <div key={domain.key} className="pet-stat-row">
              <div className="pet-stat-icon-label">
                <span className="pet-stat-icon">{meta.icon}</span>
                <span className="pet-stat-label">{meta.label}</span>
              </div>
              <div className="pet-stat-track">
                <div
                  className={`pet-stat-fill tone-${tone}`}
                  style={{ '--stat-w': `${domain.score}%` }}
                />
                <div className="pet-stat-segments">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="pet-stat-seg" />
                  ))}
                </div>
              </div>
              <div className={`pet-stat-num tone-${tone}`}>{domain.score}</div>
              <div className={`pet-stat-copy tone-${tone}`}>{statusCopy(domain.score)}</div>
            </div>
          )
        })}
      </div>

      {/* ── Biggest shifts ──────────────────────────────────────────────────── */}
      <div className="section-heading">Biggest shifts</div>

      <div className="toast-stack">
        {!dismissedWarnings.includes('priority') && (
          <div className={`toast-card toast-${statusTone(priority.score)}`} {...tilt}>
            <div className="toast-left">
              <div className="toast-icon-wrap">
                <span className="toast-emoji">{DOMAIN_ICONS[priority.key]}</span>
                <span className="toast-pulse"></span>
              </div>
            </div>
            <div className="toast-body">
              <div className="toast-tag">⚠ Priority 1</div>
              <div className="toast-title">{priority.label}</div>
              <div className="toast-score">{priority.score}<span>/100</span></div>
              <div className="toast-desc">This is your main area to focus on right now.</div>
            </div>
            <button className="toast-dismiss" onClick={() => dismissWarning('priority')}>×</button>
          </div>
        )}
        {!dismissedWarnings.includes('secondary') && (
          <div className={`toast-card toast-${statusTone(secondaryPriority.score)}`} {...tilt}>
            <div className="toast-left">
              <div className="toast-icon-wrap">
                <span className="toast-emoji">{DOMAIN_ICONS[secondaryPriority.key]}</span>
                <span className="toast-pulse"></span>
              </div>
            </div>
            <div className="toast-body">
              <div className="toast-tag">↑ Priority 2</div>
              <div className="toast-title">{secondaryPriority.label}</div>
              <div className="toast-score">{secondaryPriority.score}<span>/100</span></div>
              <div className="toast-desc">Next best lever to work on after your top priority.</div>
            </div>
            <button className="toast-dismiss" onClick={() => dismissWarning('secondary')}>×</button>
          </div>
        )}
      </div>

      {dismissedWarnings.length > 0 && (
        <div className="dismissed-section">
          <button className="dismissed-toggle" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? 'Hide' : 'Show'} dismissed ({dismissedWarnings.length})
          </button>
          {showHistory && (
            <div className="dismissed-list">
              {dismissedWarnings.includes('priority') && (
                <div className="dismissed-item">{priority.label} — main priority</div>
              )}
              {dismissedWarnings.includes('secondary') && (
                <div className="dismissed-item">{secondaryPriority.label} — next to watch</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── What stands out ─────────────────────────────────────────────────── */}
      <div className="section-heading">What stands out</div>

      <div className="standout-grid">
        <div className="standout-card green" {...tilt}>
          <img className="standout-img" src="https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=200&q=80" alt="strongest" />
          <div className="standout-label">Strongest</div>
          <div className="standout-domain">{strongest.label}</div>
          <div className="standout-score">{strongest.score}/100</div>
          <div className="standout-bar-track">
            <div className="standout-bar-fill green" style={{ '--target-width': `${strongest.score}%` }}></div>
          </div>
        </div>
        <div className="standout-card red" {...tilt}>
          <img className="standout-img" src="https://images.unsplash.com/photo-1559757175-5700dde675bc?w=200&q=80" alt="focus" />
          <div className="standout-label">Focus here</div>
          <div className="standout-domain">{priority.label}</div>
          <div className="standout-score">{priority.score}/100</div>
          <div className="standout-bar-track">
            <div className="standout-bar-fill red" style={{ '--target-width': `${priority.score}%` }}></div>
          </div>
        </div>
        {selectedSleepBand && (
          <div className="standout-card blue" {...tilt}>
            <img className="standout-img" src="https://images.unsplash.com/photo-1586042091284-bd35c8c1d917?w=200&q=80" alt="sleep" />
            <div className="standout-label">Your sleep</div>
            <div className="standout-domain">{selectedSleepBand.midpoint}h avg</div>
            <div className="standout-score">Aus avg {SLEEP_AVERAGE_18_24.overall}h</div>
            <div className="standout-bar-track">
              <div className="standout-bar-fill blue" style={{ '--target-width': `${(selectedSleepBand.midpoint / 10) * 100}%` }}></div>
            </div>
          </div>
        )}
        <div className="standout-card amber" {...tilt}>
          <img className="standout-img" src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&q=80" alt="overall" />
          <div className="standout-label">Overall vibe</div>
          <div className="standout-domain">{snapshot.overallScore}/100</div>
          <div className="standout-score">{snapshot.overallInterpretation}</div>
          <div className="standout-bar-track">
            <div className="standout-bar-fill amber" style={{ '--target-width': `${snapshot.overallScore}%` }}></div>
          </div>
        </div>
      </div>

      {/* ── Reads ───────────────────────────────────────────────────────────── */}
      <div className="section-heading">Reads for you</div>
      <div className="reads-grid">
        {recommendedArticles.map((article) => (
          <Link key={article.id} className="read-card" to="/articles" {...tilt}>
            <img className="read-img" src={article.image} alt={article.title} />
            <div className="read-body">
              <div className={`read-tag ${article.topic}`}>{article.topic.replace('_', ' ')}</div>
              <div className="read-title">{article.title}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      <div className="section-heading">Sleep decoded</div>
      <SleepDurationChart userSleepBand={selectedSleepBand} />

      <div className="section-heading">Movement decoded</div>
      <PhysicalActivityChart userActivityBand={selectedActivityBand} />
    </div>
  )
}

export default Dashboard
