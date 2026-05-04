import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Onboarding.css'
import { calculateSnapshotFromResponses } from '../utils/scoring'

const QUESTIONNAIRE_STEPS = [
  {
    key: 'sleep_rhythm',
    eyebrow: 'Domain 1 of 4',
    title: 'Sleep Rhythm',
    emoji: '🌙',
    vibe: 'How are you actually sleeping?',
    description: 'Tell us what a typical night looks like.',
    accent: '#4A9EDB',
    accentBg: 'linear-gradient(135deg, #e0f0ff 0%, #c8e4f8 100%)',
    question: {
      id: 'Q1',
      text: 'On most nights, how many hours of sleep do you usually get?',
      options: [
        { label: 'Under 6 hrs',  sub: 'running on empty', emoji: '😵' },
        { label: '6–7 hrs',      sub: 'a bit short',      emoji: '😴' },
        { label: '7–8 hrs',      sub: 'pretty solid',     emoji: '😌' },
        { label: '8–9 hrs',      sub: 'well rested',      emoji: '😊' },
        { label: '9+ hrs',       sub: 'love to see it',   emoji: '🌟' },
      ],
    },
  },
  {
    key: 'move_mode',
    eyebrow: 'Domain 2 of 4',
    title: 'Move Mode',
    emoji: '⚡',
    vibe: 'How much do you actually move?',
    description: 'We want your actual week, not your best week.',
    accent: '#1D9E75',
    accentBg: 'linear-gradient(135deg, #dcf5ec 0%, #b8ecd8 100%)',
    question: {
      id: 'Q2',
      text: 'In a usual week, how many days are you physically active for 30+ min?',
      options: [
        { label: '0 days',    sub: 'full rest mode',      emoji: '🛋️' },
        { label: '1–2 days',  sub: 'barely moving',       emoji: '🐢' },
        { label: '3–4 days',  sub: 'getting there',       emoji: '🚶' },
        { label: '5–6 days',  sub: 'consistently active', emoji: '🏃' },
        { label: 'Every day', sub: 'beast mode',          emoji: '🔥' },
      ],
    },
  },
  {
    key: 'screen_exposure',
    eyebrow: 'Domain 3 of 4',
    title: 'Screen Exposure',
    emoji: '📱',
    vibe: 'How much late-night scrolling?',
    description: "What's your Late-evening screen time? let's check in.",
    accent: '#D97855',
    accentBg: 'linear-gradient(135deg, #fef3e0 0%, #fde4b8 100%)',
    question: {
      id: 'Q3',
      text: 'How many hours a day are you on screens — especially in the evening?',
      options: [
        { label: 'Under 2 hrs', sub: 'healthy boundary', emoji: '✅' },
        { label: '2–4 hrs',     sub: 'moderate use',     emoji: '📊' },
        { label: '4–6 hrs',     sub: 'kinda a lot',      emoji: '😬' },
        { label: '6–8 hrs',     sub: 'doom scrolling',   emoji: '📲' },
        { label: '8+ hrs',      sub: 'send help',        emoji: '💀' },
      ],
    },
  },
  {
    key: 'social_energy',
    eyebrow: 'Domain 4 of 4',
    title: 'Social Energy',
    emoji: '🤝',
    vibe: 'Feeling connected lately?',
    description: 'How plugged in do you feel?',
    accent: '#9B59B6',
    accentBg: 'linear-gradient(135deg, #f3e8ff 0%, #e8d5ff 100%)',
    question: {
      id: 'Q4',
      text: 'Over the past 2 weeks, how often did you feel genuinely connected to others?',
      options: [
        { label: 'Never',     sub: 'feeling isolated', emoji: '🌑' },
        { label: 'Rarely',    sub: 'mostly solo',      emoji: '🌘' },
        { label: 'Sometimes', sub: 'hit or miss',      emoji: '🌗' },
        { label: 'Often',     sub: 'well connected',   emoji: '🌕' },
        { label: 'Always',    sub: 'fully plugged in', emoji: '✨' },
      ],
    },
  },
]

const SCORE_RING_RADIUS        = 50
const SCORE_RING_CIRCUMFERENCE = 2 * Math.PI * SCORE_RING_RADIUS

function getScoreTone(score) {
  if (score >= 75) return { tone: 'high', kicker: 'Recovery-style snapshot', message: 'You are showing a strong base right now. Keep protecting the habits doing the heavy lifting.' }
  if (score >= 50) return { tone: 'mid',  kicker: 'Recovery-style snapshot', message: 'Your baseline is decent, but one or two habits are dragging the full picture down.' }
  return { tone: 'low', kicker: 'Recovery-style snapshot', message: 'Your system looks under pressure right now. Start with the lowest-scoring area first.' }
}

function buildInsights(domainEntries) {
  const sorted = [...domainEntries].sort((a, b) => b.score - a.score)
  return { strengths: sorted.slice(0, 2), priorities: sorted.slice(-2).reverse() }
}

function AnimatedScore({ value, duration = 1100 }) {
  const [displayValue, setDisplayValue] = useState(0)
  useEffect(() => {
    let frameId
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(value * eased))
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [value, duration])
  return displayValue
}

function createDashboardPayload(scoring, responses) {
  if (!scoring) return null
  const dashboardResponses = {
    Q1: scoring.normalizedResponses.Q1,
    Q2: scoring.normalizedResponses.Q2,
    Q3: scoring.normalizedResponses.Q3,
    Q4: scoring.normalizedResponses.Q4,
    Q4_social: scoring.normalizedResponses.Q4,
  }
  return {
    onboardingCompleted: true,
    completedAt: new Date().toISOString(),
    questionnaireVersion: 'iteration-1-final-4q',
    responses: dashboardResponses,
    questionnaireResponses: responses,
    overallScore: scoring.overallScore,
    overallInterpretation: scoring.overallInterpretation,
    domainScores: scoring.domainScoresLegacy,
  }
}

function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState({})
  const [showValidation, setShowValidation] = useState(false)
  const totalSteps = QUESTIONNAIRE_STEPS.length + 1

  const currentStep = QUESTIONNAIRE_STEPS[step]
  const isResultStep = step === QUESTIONNAIRE_STEPS.length

  const setAnswer = (questionId, value) => {
    setResponses((c) => ({ ...c, [questionId]: value }))
    setShowValidation(false)
  }

  const stepComplete = currentStep ? Boolean(responses[currentStep.question.id]) : true

  const nextStep = () => {
    if (!stepComplete) { setShowValidation(true); return }
    if (step === QUESTIONNAIRE_STEPS.length - 1) {
      const payload = createDashboardPayload(calculateSnapshotFromResponses(responses), responses)
      if (payload) { localStorage.setItem('brainboostSnapshot', JSON.stringify(payload)); navigate('/dashboard', { state: payload }) }
      return
    }
    if (step < QUESTIONNAIRE_STEPS.length) { setStep(step + 1); setShowValidation(false) }
  }

  const prevStep = () => { if (step > 0) { setStep(step - 1); setShowValidation(false) } }

  const scoring        = calculateSnapshotFromResponses(responses)
  const domainScores   = scoring?.domainScoresLatest ?? []
  const overallScore   = scoring?.overallScore ?? 0
  const interpretation = scoring?.overallInterpretation ?? 'priority area for support'
  const insights       = buildInsights(domainScores)
  const progressPercent = ((step + 1) / totalSteps) * 100
  const scoreTone      = getScoreTone(overallScore)

  const handleGoToDashboard = () => {
    const payload = createDashboardPayload(scoring, responses)
    if (!payload) return
    localStorage.setItem('brainboostSnapshot', JSON.stringify(payload))
    navigate('/dashboard', { state: payload })
  }

  useEffect(() => {
    if (!isResultStep) return
    const payload = createDashboardPayload(scoring, responses)
    if (!payload) return
    localStorage.setItem('brainboostSnapshot', JSON.stringify(payload))
    navigate('/dashboard', { state: payload })
  }, [isResultStep, responses, scoring])

  return (
    <div className="ob-wrap">
      <div className="ob-ambient ob-ambient-one"></div>
      <div className="ob-ambient ob-ambient-two"></div>
      <div className="ob-ambient ob-ambient-three"></div>

      {/* Progress bar */}
      <div className="ob-progress-row">
        <div className="ob-progress-track">
          <div className="ob-progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="ob-step-label">Step {step + 1} of {totalSteps}</div>
      </div>

      <div className="ob-card">
        {!isResultStep && (
          <div>
            {/* Domain header banner */}
            <div className="ob-domain-header" style={{ background: currentStep.accentBg }}>
              <span className="ob-domain-emoji">{currentStep.emoji}</span>
              <div className="ob-domain-header-text">
                <div className="ob-domain-eyebrow" style={{ color: currentStep.accent }}>{currentStep.eyebrow}</div>
                <div className="ob-domain-title">{currentStep.title}</div>
              </div>
              <span className="ob-domain-pct" style={{ color: currentStep.accent }}>{Math.round(progressPercent)}%</span>
            </div>

            <div className="ob-vibe">{currentStep.vibe}</div>
            <div className="ob-desc">{currentStep.description}</div>

            <div className="question-list">
              <div className="question-card">
                <label className="field-label">{currentStep.question.text}</label>
                <div className="option-grid cols-1">
                  {currentStep.question.options.map((option, index) => {
                    const value = index + 1
                    const selected = responses[currentStep.question.id] === value
                    return (
                      <button
                        key={option.label}
                        type="button"
                        className={`opt-btn ob-opt-new ${selected ? 'selected' : ''}`}
                        style={selected ? { borderColor: currentStep.accent, boxShadow: `0 6px 24px ${currentStep.accent}30` } : {}}
                        onClick={() => setAnswer(currentStep.question.id, value)}
                      >
                        <span className="ob-opt-emoji">{option.emoji}</span>
                        <span className="ob-opt-text">
                          <span className="ob-opt-label">{option.label}</span>
                          <span className="ob-opt-sub">{option.sub}</span>
                        </span>
                        {selected && <span className="ob-opt-check" style={{ color: currentStep.accent }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {showValidation && (
              <div className="validation-text">Please choose one answer before continuing.</div>
            )}

            <div className="ob-footer">
              {step > 0 ? (
                <button type="button" className="btn-back" onClick={prevStep}>Back</button>
              ) : (
                <div className="btn-spacer"></div>
              )}
              <button
                type="button"
                className="btn-next"
                style={{ background: `linear-gradient(135deg, ${currentStep.accent}, ${currentStep.accent}cc)` }}
                onClick={nextStep}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {isResultStep && (
          <div>
            <div className="ob-step-meta">
              <span className="ob-step-pill">Snapshot complete</span>
              <span className="ob-step-pill soft">Ready for dashboard</span>
            </div>
            <div className="ob-eyebrow">Your Result</div>
            <div className="ob-title">Your brain health snapshot is ready</div>

            <div className={`snapshot-hero tone-${scoreTone.tone}`}>
              <div className="snapshot-particles">
                <span className="snapshot-particle particle-a"></span>
                <span className="snapshot-particle particle-b"></span>
                <span className="snapshot-particle particle-c"></span>
              </div>
              <div className="snapshot-copy">
                <div className="snapshot-kicker">{scoreTone.kicker}</div>
                <div className="snapshot-headline">{interpretation}</div>
                <div className="snapshot-body">{scoreTone.message}</div>
              </div>
              <div className="score-ring-wrap">
                <div className={`score-ring tone-${scoreTone.tone}`}>
                  <div className="score-ring-glow"></div>
                  <svg className="score-ring-svg" viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r={SCORE_RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
                    <circle cx="60" cy="60" r={SCORE_RING_RADIUS} fill="none" stroke="url(#scoreGradient)" strokeWidth="10"
                      strokeDasharray={SCORE_RING_CIRCUMFERENCE}
                      strokeDashoffset={SCORE_RING_CIRCUMFERENCE - (SCORE_RING_CIRCUMFERENCE * overallScore) / 100}
                      strokeLinecap="round" transform="rotate(-90 60 60)" />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8ed8ff" />
                        <stop offset="52%" stopColor="#4a9edb" />
                        <stop offset="100%" stopColor="#49b38f" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="score-number">
                    <div className="score-num"><AnimatedScore value={overallScore} /></div>
                    <div className="score-sub">/ 100</div>
                  </div>
                </div>
                <div className="score-caption">Current brain health score</div>
              </div>
            </div>

            <div className="result-tagline">
              Your score reflects four key habit areas — higher always means stronger current habits.
            </div>

            <div className="result-grid">
              {insights.strengths.map((domain) => (
                <div key={`strength-${domain.key}`} className="result-item strength">
                  <div className="result-item-label">Stronger area</div>
                  <div className="result-item-text">{domain.label}: {domain.score}/100</div>
                </div>
              ))}
              {insights.priorities.map((domain) => (
                <div key={`priority-${domain.key}`} className="result-item risk">
                  <div className="result-item-label">Priority area</div>
                  <div className="result-item-text">{domain.label}: {domain.score}/100</div>
                </div>
              ))}
            </div>

            <div className="disclaimer">
              BrainBoost provides lifestyle awareness only. It is not a medical, psychological, or diagnostic assessment.
            </div>

            <div className="ob-footer">
              <button type="button" className="btn-back" onClick={prevStep}>Back</button>
              <button type="button" className="btn-next" onClick={handleGoToDashboard}>Go to my dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Onboarding
