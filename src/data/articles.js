// ─────────────────────────────────────────────────────────────────────────────
// Article data for BrainBoost's Article Hub.
//
// Each article object has the following fields:
//   id          — unique string identifier used as React key
//   topic       — domain key: 'sleep_rhythm' | 'move_mode' | 'cognitive_strain' | 'social_energy'
//                 Must match the domain keys in scoring.js / recommendations.js so that
//                 personalised recommendations can match articles to weak domains.
//   image       — Unsplash URL for the article cover image
//   title       — display title shown on the article card
//   source      — publisher name shown as a badge (e.g. 'headspace', 'WHO')
//   sourceBadge — CSS class suffix for the coloured source badge
//   readTime    — short label (e.g. '13 min read', 'Youth guide')
//   summary     — one-sentence description shown on the card and in the modal
//   url         — link to the original article, opened in a new tab
//
// Four quick-read articles exist per domain (16 total) so each topic always has content
// even when only one domain is flagged as a priority for the user.
// ─────────────────────────────────────────────────────────────────────────────
export const ARTICLES = [
  // ── Sleep Rhythm ────────────────────────────────────────────────────────────
  {
    id: 'sleep-healthdirect-insomnia',
    topic: 'sleep_rhythm',
    image:
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80',
    title: 'Get enough sleep for a healthy headspace',
    source: 'headspace',
    sourceBadge: 'headspace',
    readTime: '30 sec read',
    summary:
      'A youth-focused guide linking sleep with study stress, mood, concentration, and screen habits for people aged 12-25.',
    url: 'https://headspace.org.au/explore-topics/for-young-people/get-enough-sleep/',
  },
  {
    id: 'sleep-nih-good-sleep',
    topic: 'sleep_rhythm',
    image:
      'https://images.unsplash.com/photo-1520206183501-b80df61043c2?auto=format&fit=crop&w=1200&q=80',
    title: 'Insomnia: causes, symptoms and treatments',
    source: 'healthdirect',
    sourceBadge: 'healthdirect',
    readTime: '30 sec read',
    summary:
      'An Australian government-backed guide to sleep problems, sleep hygiene, and when to seek medical help.',
    url: 'https://www.healthdirect.gov.au/insomnia',
  },
  {
    id: 'sleep-healthdirect-sleep-basics',
    topic: 'sleep_rhythm',
    image:
      'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?auto=format&fit=crop&w=1200&q=80',
    title: 'Sleep: why it matters and how to improve it',
    source: 'healthdirect',
    sourceBadge: 'healthdirect',
    readTime: '30 sec read',
    summary:
      'A clear guide to sleep cycles, recommended sleep hours, screen-free wind-down habits, and why sleep supports mood and focus.',
    url: 'https://www.healthdirect.gov.au/sleep',
  },
  {
    id: 'sleep-cdc-about-sleep',
    topic: 'sleep_rhythm',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    title: 'About sleep',
    source: 'CDC',
    sourceBadge: 'cdc',
    readTime: '30 sec read',
    summary:
      'CDC explains how much sleep adults need, why quality matters, and which habits help protect energy, memory, and mood.',
    url: 'https://www.cdc.gov/sleep/about/index.html',
  },

  // ── Move Mode ───────────────────────────────────────────────────────────────
  {
    id: 'move-who-physical-activity-facts',
    topic: 'move_mode',
    image:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
    title: 'Stay active for a healthy headspace',
    source: 'headspace',
    sourceBadge: 'headspace',
    readTime: '30 sec read',
    summary:
      'A practical guide for young people on using movement to lift mood, reduce stress, and support better sleep.',
    url: 'https://headspace.org.au/explore-topics/for-young-people/wellbeing/stay-active/',
  },
  {
    id: 'move-who-behealthy',
    topic: 'move_mode',
    image:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
    title: 'Physical activity fact sheet',
    source: 'WHO',
    sourceBadge: 'who',
    readTime: '30 sec read',
    summary:
      'WHO guidance on how physical activity improves health and what activity levels adults should aim for each week.',
    url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
  },
  {
    id: 'move-who-activity-recommendations',
    topic: 'move_mode',
    image:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
    title: 'Physical activity recommendations for adults',
    source: 'WHO',
    sourceBadge: 'who',
    readTime: '30 sec read',
    summary:
      'WHO breaks down the weekly movement targets for adults aged 18-64, including moderate, vigorous, and muscle-strengthening activity.',
    url: 'https://www.who.int/initiatives/behealthy/physical-activity',
  },
  {
    id: 'move-healthdirect-exercise-mental-health',
    topic: 'move_mode',
    image:
      'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=80',
    title: 'Exercise and mental health',
    source: 'healthdirect',
    sourceBadge: 'healthdirect',
    readTime: '30 sec read',
    summary:
      'A practical healthdirect guide on how movement can reduce stress, support sleep, and help you start at a realistic pace.',
    url: 'https://www.healthdirect.gov.au/exercise-and-mental-health',
  },

  // ── Cognitive Strain ────────────────────────────────────────────────────────
  {
    id: 'strain-who-stress-qa',
    topic: 'cognitive_strain',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    title: 'Everything you need to know about stress',
    source: 'ReachOut',
    sourceBadge: 'reachout',
    readTime: '30 sec read',
    summary:
      'A young-adult-friendly explainer on stress, what it does to your body, and how to manage uni, work, and life pressure.',
    url: 'https://au.reachout.com/challenges-and-coping/stress/everything-you-need-to-know-about-stress',
  },
  {
    id: 'strain-who-doing-what-matters',
    topic: 'cognitive_strain',
    image:
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80',
    title: 'What is burnout?',
    source: 'ReachOut',
    sourceBadge: 'reachout',
    readTime: '30 sec read',
    summary:
      'Helps young people spot burnout, understand how it differs from stress, and start recovering before everything feels too heavy.',
    url: 'https://au.reachout.com/articles/burnout-and-chronic-stress',
  },
  {
    id: 'strain-healthdirect-young-people-stress',
    topic: 'cognitive_strain',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    title: 'Stress in young people',
    source: 'healthdirect',
    sourceBadge: 'healthdirect',
    readTime: '30 sec read',
    summary:
      'An Australian health guide on common stress signs in young people, including poor sleep, low concentration, and when to get support.',
    url: 'https://www.healthdirect.gov.au/stress-in-young-people',
  },
  {
    id: 'strain-headspace-exam-stress',
    topic: 'cognitive_strain',
    image:
      'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    title: 'Managing stress at exam time',
    source: 'headspace',
    sourceBadge: 'headspace',
    readTime: '30 sec read',
    summary:
      'Headspace shares young-person advice for handling study pressure, comparison, breaks, and exam-season stress.',
    url: 'https://headspace.org.au/our-organisation/media-releases/a-young-persons-guide-to-managing-stress-at-exam-time-and-what-we-can-all-do-to-support-them/',
  },

  // ── Social Energy ────────────────────────────────────────────────────────────
  {
    id: 'social-cdc-about',
    topic: 'social_energy',
    image:
      'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80',
    title: "Ask a therapist: What to do if you're feeling lonely",
    source: 'ReachOut',
    sourceBadge: 'reachout',
    readTime: '30 sec read',
    summary:
      'A practical article for young people on loneliness, disconnection, and how to rebuild a stronger sense of connection.',
    url: 'https://au.reachout.com/challenges-and-coping/isolation-and-loneliness/ask-a-therapist-what-to-do-if-youre-feeling-lonely',
  },
  {
    id: 'social-cdc-improving',
    topic: 'social_energy',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    title: 'How to have good mental health',
    source: 'headspace',
    sourceBadge: 'headspace',
    readTime: '30 sec read',
    summary:
      'Includes young-person advice on staying connected, staying active, sleeping well, and building habits that support wellbeing.',
    url: 'https://headspace.org.au/explore-topics/for-young-people/tips-for-a-healthy-headspace/',
  },
  {
    id: 'social-cdc-improving-connections',
    topic: 'social_energy',
    image:
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80',
    title: 'Improving social connectedness',
    source: 'CDC',
    sourceBadge: 'cdc',
    readTime: '30 sec read',
    summary:
      'CDC suggestions for building meaningful connection through small check-ins, stronger relationships, and healthier social support.',
    url: 'https://www.cdc.gov/social-connectedness/improving/index.html',
  },
  {
    id: 'social-cdc-about-connection',
    topic: 'social_energy',
    image:
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80',
    title: 'Why social connection matters',
    source: 'CDC',
    sourceBadge: 'cdc',
    readTime: '30 sec read',
    summary:
      'CDC explains how supportive relationships can protect mental health, lower stress, and help people feel valued and connected.',
    url: 'https://www.cdc.gov/social-connectedness/about/index.html',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC_META — display metadata for each domain topic.
//
// Used by ArticleHub.jsx to:
//   - Render the filter button labels (label).
//   - Render the short topic chip inside recommendation pills (shortLabel).
//   - Apply the correct CSS class to colour-code article cards (topic key as class name).
// ─────────────────────────────────────────────────────────────────────────────
export const TOPIC_META = {
  sleep_rhythm: {
    label: 'Sleep Rhythm',    // full label used in the topic filter buttons
    shortLabel: 'Sleep',      // abbreviated label used in article pill chips
  },
  move_mode: {
    label: 'Move Mode',
    shortLabel: 'Movement',
  },
  cognitive_strain: {
    label: 'Cognitive Strain',
    shortLabel: 'Strain',
  },
  social_energy: {
    label: 'Social Energy',
    shortLabel: 'Social',
  },
}
