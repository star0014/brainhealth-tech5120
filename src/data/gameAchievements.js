// ─────────────────────────────────────────────────────────────────────────────
// gameAchievements.js — shared achievement definitions used by both
// Progress.jsx (full history view) and MiniGames.jsx (inline tab).
// ─────────────────────────────────────────────────────────────────────────────

const GAME_ACHIEVEMENTS = [
  // ── Reaction Test ────────────────────────────────────────────────────────────
  {
    id: 'reaction_first', emoji: '⚡', rarity: 'common',
    label: 'First Tap',
    desc: 'Played your first Reaction Test',
    hint: 'Play the Reaction Test once',
    condition: s => s.some(g => g.game_id === 'reaction'),
  },
  {
    id: 'reaction_decent', emoji: '🏹', rarity: 'common',
    label: 'Getting Warmed Up',
    desc: 'Reacted in under 350ms — solid start',
    hint: 'React in under 350ms',
    condition: s => s.some(g => g.game_id === 'reaction' && g.score < 350),
  },
  {
    id: 'understood', emoji: '🎯', rarity: 'rare',
    label: 'Understood The Assignment',
    desc: 'Got under 300ms on the Reaction Test',
    hint: 'React in under 300ms',
    condition: s => s.some(g => g.game_id === 'reaction' && g.score < 300),
  },
  {
    id: 'built_different', emoji: '🚀', rarity: 'legendary',
    label: 'Built Different',
    desc: "Sub 250ms reaction time — you're just wired differently",
    hint: 'React in under 250ms',
    condition: s => s.some(g => g.game_id === 'reaction' && g.score < 250),
  },
  {
    id: 'reaction_grind', emoji: '🔁', rarity: 'common',
    label: 'On Repeat',
    desc: 'Played the Reaction Test 5 times — the grind is real',
    hint: 'Play Reaction Test 5 times',
    condition: s => s.filter(g => g.game_id === 'reaction').length >= 5,
  },
  {
    id: 'reaction_beast', emoji: '🦾', rarity: 'legendary',
    label: 'Cyborg Mode',
    desc: 'Sub 200ms reaction — genuinely not human',
    hint: 'React in under 200ms',
    condition: s => s.some(g => g.game_id === 'reaction' && g.score < 200),
  },

  // ── Memory Match ─────────────────────────────────────────────────────────────
  {
    id: 'memory_first', emoji: '🃏', rarity: 'common',
    label: 'First Flip',
    desc: 'Played your first Memory Match',
    hint: 'Play Memory Match once',
    condition: s => s.some(g => g.game_id === 'memory'),
  },
  {
    id: 'big_brain', emoji: '🧠', rarity: 'rare',
    label: 'Big Brain Behavior',
    desc: 'Finished Memory Match in 20 moves or less',
    hint: 'Complete Memory Match in ≤20 moves',
    condition: s => s.some(g => g.game_id === 'memory' && g.score <= 20),
  },
  {
    id: 'no_crumbs', emoji: '✨', rarity: 'legendary',
    label: 'Ate And Left No Crumbs',
    desc: 'Crushed Memory Match in 16 moves or less',
    hint: 'Complete Memory Match in ≤16 moves',
    condition: s => s.some(g => g.game_id === 'memory' && g.score <= 16),
  },
  {
    id: 'memory_grind', emoji: '🔄', rarity: 'common',
    label: 'Card Shark',
    desc: 'Played Memory Match 5 times — you love the cards',
    hint: 'Play Memory Match 5 times',
    condition: s => s.filter(g => g.game_id === 'memory').length >= 5,
  },
  {
    id: 'memory_elite', emoji: '💎', rarity: 'legendary',
    label: 'Photographic Memory',
    desc: 'Finished Memory Match in 12 moves or less — elite recall',
    hint: 'Complete Memory Match in ≤12 moves',
    condition: s => s.some(g => g.game_id === 'memory' && g.score <= 12),
  },

  // ── Stroop Test ──────────────────────────────────────────────────────────────
  {
    id: 'stroop_first', emoji: '🌈', rarity: 'common',
    label: 'Colour Coded',
    desc: 'Played your first Stroop Test',
    hint: 'Play the Stroop Test once',
    condition: s => s.some(g => g.game_id === 'stroop'),
  },
  {
    id: 'no_cap', emoji: '💯', rarity: 'rare',
    label: 'No Cap',
    desc: '80%+ accuracy on Stroop — your focus is locked in',
    hint: 'Score 80%+ accuracy on Stroop',
    condition: s => s.some(g => g.game_id === 'stroop' && g.score >= 80),
  },
  {
    id: 'stroop_elite', emoji: '🎨', rarity: 'legendary',
    label: 'Laser Focus',
    desc: '95%+ accuracy on Stroop — your attention control is elite',
    hint: 'Score 95%+ accuracy on Stroop',
    condition: s => s.some(g => g.game_id === 'stroop' && g.score >= 95),
  },
  {
    id: 'stroop_grind', emoji: '🎭', rarity: 'common',
    label: 'Colour Run',
    desc: 'Played Stroop Test 5 times — you love the colours',
    hint: 'Play Stroop Test 5 times',
    condition: s => s.filter(g => g.game_id === 'stroop').length >= 5,
  },

  // ── Visual Pattern ───────────────────────────────────────────────────────────
  {
    id: 'pattern_first', emoji: '🔲', rarity: 'common',
    label: 'Pattern Recognition',
    desc: 'Played your first Visual Pattern game',
    hint: 'Play Visual Pattern once',
    condition: s => s.some(g => g.game_id === 'visual_pattern'),
  },
  {
    id: 'pattern_pro', emoji: '🧩', rarity: 'rare',
    label: 'Galaxy Brain',
    desc: 'Reached level 6 in Visual Pattern — your memory is built different',
    hint: 'Reach level 6 in Visual Pattern',
    condition: s => s.some(g => g.game_id === 'visual_pattern' && g.score >= 6),
  },
  {
    id: 'pattern_legend', emoji: '🌀', rarity: 'legendary',
    label: 'Limitless',
    desc: 'Reached level 9 in Visual Pattern — genuinely insane recall',
    hint: 'Reach level 9 in Visual Pattern',
    condition: s => s.some(g => g.game_id === 'visual_pattern' && g.score >= 9),
  },
  {
    id: 'pattern_grind', emoji: '📐', rarity: 'common',
    label: 'Grid Locked',
    desc: 'Played Visual Pattern 5 times — you enjoy the grid',
    hint: 'Play Visual Pattern 5 times',
    condition: s => s.filter(g => g.game_id === 'visual_pattern').length >= 5,
  },

  // ── Mental Math ──────────────────────────────────────────────────────────────
  {
    id: 'math_first', emoji: '🔢', rarity: 'common',
    label: 'Do The Math',
    desc: 'Played your first Mental Math game',
    hint: 'Play Mental Math once',
    condition: s => s.some(g => g.game_id === 'mental_math'),
  },
  {
    id: 'math_decent', emoji: '📊', rarity: 'common',
    label: 'Number Cruncher',
    desc: 'Scored 10+ correct in Mental Math — getting there',
    hint: 'Score 10+ correct in Mental Math',
    condition: s => s.some(g => g.game_id === 'mental_math' && g.score >= 10),
  },
  {
    id: 'math_sharp', emoji: '📈', rarity: 'rare',
    label: 'Big Number Szn',
    desc: 'Scored 18+ correct in Mental Math — your brain is on another level',
    hint: 'Score 18+ correct in Mental Math',
    condition: s => s.some(g => g.game_id === 'mental_math' && g.score >= 18),
  },
  {
    id: 'math_legend', emoji: '🧮', rarity: 'legendary',
    label: 'Human Calculator',
    desc: '25+ correct in 60 seconds — are you even human right now',
    hint: 'Score 25+ correct in Mental Math',
    condition: s => s.some(g => g.game_id === 'mental_math' && g.score >= 25),
  },
  {
    id: 'math_grind', emoji: '📝', rarity: 'common',
    label: 'Extra Credit',
    desc: 'Played Mental Math 5 times — maths is your thing',
    hint: 'Play Mental Math 5 times',
    condition: s => s.filter(g => g.game_id === 'mental_math').length >= 5,
  },

  // ── Cross-game ───────────────────────────────────────────────────────────────
  {
    id: 'holy_trinity', emoji: '🙏', rarity: 'rare',
    label: 'The Holy Trinity',
    desc: 'Played all 3 original games — respect',
    hint: 'Play Reaction, Memory and Stroop at least once',
    condition: s => ['reaction', 'memory', 'stroop'].every(id => s.some(g => g.game_id === id)),
  },
  {
    id: 'all_five', emoji: '🎮', rarity: 'legendary',
    label: 'Full Send',
    desc: 'Played all 5 games — you are built for this',
    hint: 'Play all 5 games at least once',
    condition: s => ['reaction', 'memory', 'stroop', 'visual_pattern', 'mental_math'].every(id => s.some(g => g.game_id === id)),
  },
  {
    id: 'consistent', emoji: '📅', rarity: 'rare',
    label: 'Showing Up',
    desc: 'Played 20 games total — consistency is the whole vibe',
    hint: 'Play any game 20 times total',
    condition: s => s.length >= 20,
  },
  {
    id: 'main_character', emoji: '🔥', rarity: 'legendary',
    label: 'Main Character Energy',
    desc: 'Played 10+ games total — the dedication is real',
    hint: 'Play any game 10 times total',
    condition: s => s.length >= 10,
  },
  {
    id: 'perfectionist', emoji: '🏆', rarity: 'legendary',
    label: 'Perfectionist',
    desc: 'Unlocked 15 or more achievements — you are actually that person',
    hint: 'Unlock 15 achievements',
    condition: s => GAME_ACHIEVEMENTS.filter(a => a.id !== 'perfectionist' && a.condition(s)).length >= 15,
  },
  {
    id: 'speed_and_memory', emoji: '🎯', rarity: 'rare',
    label: 'Two For One',
    desc: 'Personal bested both Reaction and Memory Match in the same session',
    hint: 'Score under 300ms on Reaction AND under 20 moves on Memory',
    condition: s => s.some(g => g.game_id === 'reaction' && g.score < 300) && s.some(g => g.game_id === 'memory' && g.score <= 20),
  },
  {
    id: 'triple_threat', emoji: '🌟', rarity: 'legendary',
    label: 'Triple Threat',
    desc: 'Hit a great score in Reaction, Memory AND Stroop — well-rounded brain',
    hint: 'Score under 300ms Reaction, ≤20 moves Memory, and 80%+ Stroop',
    condition: s =>
      s.some(g => g.game_id === 'reaction' && g.score < 300) &&
      s.some(g => g.game_id === 'memory' && g.score <= 20) &&
      s.some(g => g.game_id === 'stroop' && g.score >= 80),
  },
]

export { GAME_ACHIEVEMENTS }
