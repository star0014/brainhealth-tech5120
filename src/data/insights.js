// Short, inline Dashboard recommendations.
// These keep source credibility from the Article Hub, but present the useful part
// as a 30-second action card instead of asking users to leave the app.
export const INSIGHTS = [
  {
    id: 'sleep-wind-down',
    topic: 'sleep_rhythm',
    label: 'Sleep',
    icon: 'moon',
    image:
      'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?auto=format&fit=crop&w=900&q=80',
    eyebrow: 'Sleep is dragging the vibe',
    title: 'Power down like you mean it',
    insight:
      'Give your brain one obvious signal that the day is over.',
    steps: [
      'Set a bedtime alarm',
      'Park your phone away',
      'Cue shower, stretch, or music',
    ],
    source: 'healthdirect',
    sourceUrl: 'https://www.healthdirect.gov.au/sleep',
  },
  {
    id: 'movement-ten-minute-reset',
    topic: 'move_mode',
    label: 'Movement',
    icon: 'bolt',
    image:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80',
    eyebrow: 'Energy is asking for a reboot',
    title: 'Hit a 10-minute reset',
    insight:
      'Skip the full workout pressure. Start with the tiny version.',
    steps: [
      'Pick one study break',
      'Walk for 10 minutes',
      'Repeat after long sitting',
    ],
    source: 'WHO',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
  },
  {
    id: 'screen-focus-buffer',
    topic: 'cognitive_strain',
    label: 'Screen',
    icon: 'phone',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    eyebrow: 'Screen time is getting loud',
    title: 'Drop one no-scroll buffer',
    insight:
      'No need to vanish offline. Just add one clean boundary.',
    steps: [
      'Pick bedtime or study',
      'Flip your phone face-down',
      'Run a 20-minute timer',
    ],
    source: 'headspace',
    sourceUrl: 'https://headspace.org.au/explore-topics/for-young-people/get-enough-sleep/',
  },
  {
    id: 'social-one-message',
    topic: 'social_energy',
    label: 'Social',
    icon: 'chat',
    image:
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=80',
    eyebrow: 'Connection could use a spark',
    title: 'Send the low-effort text',
    insight:
      'A tiny check-in still counts. Keep it easy.',
    steps: [
      'Pick one easy person',
      'Send: "Hey, how has your week been?"',
      'No plan needed',
    ],
    source: 'ReachOut',
    sourceUrl: 'https://au.reachout.com/challenges-and-coping/isolation-and-loneliness/ask-a-therapist-what-to-do-if-youre-feeling-lonely',
  },
]
