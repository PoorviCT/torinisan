export const families = ['color', 'number', 'shape', 'size', 'direction', 'alternation'] as const;
export type Family = (typeof families)[number];
export type Tier = 0 | 1 | 2 | 3 | 4;
export type Random = () => number;

export type Term = {
  key: string;
  label: string;
  glyph: string;
  cue: string;
  rank?: number;
  kind?: string;
};

export type Round = {
  id: string;
  family: Family;
  templateId: string;
  tier: Tier;
  terms: readonly Term[];
  choices: readonly Term[];
  answerKey: string;
  limitMs: number;
  deadline: number | null;
};

export const tierSeconds = [12, 10, 8, 6, 4] as const;
export const tierNames = ['Warm-up', 'Finding rhythm', 'Mixed signals', 'Pressure', 'Breakneck'] as const;

export function tierOf(chain: number): Tier {
  return chain <= 3 ? 0 : chain <= 7 ? 1 : chain <= 12 ? 2 : chain <= 20 ? 3 : 4;
}

function term(key: string, label: string, glyph: string, cue: string, rank?: number, kind?: string): Term {
  return { key, label, glyph, cue, rank, kind };
}

const colors = [
  term('color:red', 'Red', 'RED', 'red · diagonal lines', undefined, 'red'),
  term('color:blue', 'Blue', 'BLUE', 'blue · dots', undefined, 'blue'),
  term('color:green', 'Green', 'GREEN', 'green · grid', undefined, 'green'),
  term('color:yellow', 'Yellow', 'YELLOW', 'yellow · horizontal lines', undefined, 'yellow'),
];
const shapes = [
  term('shape:3', 'Triangle · 3 sides', '△', 'triangle outline, 3 sides', 3),
  term('shape:4', 'Square · 4 sides', '□', 'square outline, 4 sides', 4),
  term('shape:5', 'Pentagon · 5 sides', '⬠', 'pentagon outline, 5 sides', 5),
  term('shape:6', 'Hexagon · 6 sides', '⬡', 'hexagon outline, 6 sides', 6),
  term('shape:7', 'Heptagon · 7 sides', '⬡', 'heptagon, 7 sides', 7),
  term('shape:8', 'Octagon · 8 sides', '⯃', 'octagon outline, 8 sides', 8),
];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((label, rank) =>
  term(`size:${rank}`, label, label, `${label}, size ${rank + 1} of 6`, rank));
const directions = [
  term('direction:0', 'North', '↑', 'north, arrow up', 0),
  term('direction:1', 'East', '→', 'east, arrow right', 1),
  term('direction:2', 'South', '↓', 'south, arrow down', 2),
  term('direction:3', 'West', '←', 'west, arrow left', 3),
];
const alternating = [
  term('alternation:a', 'Triangle 1', '△ 1', 'triangle 1'),
  term('alternation:b', 'Circle 2', '○ 2', 'circle 2'),
  term('alternation:c', 'Triangle 2', '△ 2', 'triangle 2'),
  term('alternation:d', 'Circle 1', '○ 1', 'circle 1'),
];
const number = (value: number) => term(`number:${value}`, String(value), String(value), `number ${value}`, value);

type Template = { id: string; family: Family; minTier: Tier; terms: readonly Term[]; answer: Term; distractors: readonly Term[]; certificate: string };
// Finite, reviewed histories: distractors never contain a second continuation under
// repeat, ABAB, arithmetic progression, parity, rank or quarter-turn hypotheses.
const templates: readonly Template[] = [
  { id: 'color-ab', family: 'color', minTier: 0, terms: [colors[0], colors[1], colors[0], colors[1]], answer: colors[0], distractors: [colors[1], colors[2], colors[3]], certificate: 'ABAB color names and textures agree; no other choice repeats A.' },
  { id: 'number-two', family: 'number', minTier: 0, terms: [1, 3, 5, 7].map(number), answer: number(9), distractors: [8, 10, 12].map(number), certificate: '+2 and odd parity give 9; all distractors are even.' },
  { id: 'direction-clockwise', family: 'direction', minTier: 0, terms: directions, answer: directions[0], distractors: directions.slice(1), certificate: 'Four distinct compass points turn clockwise; only north completes it.' },
  { id: 'alternation-ab', family: 'alternation', minTier: 0, terms: [alternating[0], alternating[1], alternating[0], alternating[1]], answer: alternating[0], distractors: [alternating[1], alternating[2], alternating[3]], certificate: 'The full symbol-number pair repeats ABAB; only triangle 1 repeats A.' },
  { id: 'shape-sides', family: 'shape', minTier: 1, terms: shapes.slice(0, 4), answer: shapes[4], distractors: [shapes[2], shapes[5], shapes[3]], certificate: 'Side counts 3,4,5,6 increment by one; only seven sides follows.' },
  { id: 'size-rank', family: 'size', minTier: 1, terms: sizes.slice(0, 4), answer: sizes[4], distractors: [sizes[2], sizes[5], sizes[3]], certificate: 'Labeled ordinal sizes 1-4 increment by one; only XL follows.' },
  { id: 'number-three', family: 'number', minTier: 3, terms: [2, 5, 8, 11].map(number), answer: number(14), distractors: [13, 15, 17].map(number), certificate: '+3 gives 14; alternating parity also excludes all odd distractors.' },
  { id: 'direction-halfturn', family: 'direction', minTier: 3, terms: [directions[0], directions[2], directions[0], directions[2]], answer: directions[0], distractors: directions.slice(1), certificate: 'Half-turn and ABAB agree on north; other compass points do not.' },
  { id: 'color-second-pair', family: 'color', minTier: 3, terms: [colors[2], colors[3], colors[2], colors[3]], answer: colors[2], distractors: [colors[3], colors[0], colors[1]], certificate: 'Green-yellow alternating identities and textures both require green.' },
  { id: 'shape-later-sides', family: 'shape', minTier: 3, terms: shapes.slice(1, 5), answer: shapes[5], distractors: [shapes[2], shapes[3], shapes[4]], certificate: 'Four through seven sides ascend one step; only eight sides follows.' },
  { id: 'size-later-rank', family: 'size', minTier: 3, terms: sizes.slice(1, 5), answer: sizes[5], distractors: [sizes[2], sizes[3], sizes[4]], certificate: 'Ordinal ranks 2-5 ascend one step; only XXL follows.' },
  { id: 'alternation-reverse-pair', family: 'alternation', minTier: 3, terms: [alternating[1], alternating[0], alternating[1], alternating[0]], answer: alternating[1], distractors: [alternating[0], alternating[2], alternating[3]], certificate: 'The reversed composite pair repeats BABA; only circle 2 is B.' },
];

function pickIndex(length: number, rng: Random): number {
  return Math.min(length - 1, Math.max(0, Math.floor(rng() * length)));
}

export function chooseFamily(tier: Tier, previous: Family | null, rng: Random = Math.random): Family {
  const eligible = families.filter((family) => (tier > 0 || (family !== 'shape' && family !== 'size')) && family !== previous);
  if (!eligible.length) throw new Error('No eligible puzzle family');
  return eligible[pickIndex(eligible.length, rng)];
}

function shuffle<T>(items: readonly T[], rng: Random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = pickIndex(index + 1, rng);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function plausibleKeys(round: Round): Set<string> {
  const [a, b, c, d] = round.terms;
  const keys = new Set<string>();
  if (a.key === c.key && b.key === d.key) keys.add(a.key);
  if (a.key === b.key && b.key === c.key && c.key === d.key) keys.add(a.key);
  if (round.family === 'number' || round.family === 'shape' || round.family === 'size') {
    const ranks = round.terms.map((item) => item.rank);
    if (ranks.every((rank) => typeof rank === 'number')) {
      const [first, second, third, fourth] = ranks as number[];
      if (second - first === third - second && third - second === fourth - third) {
        const next = fourth + (second - first);
        for (const choice of round.choices) if (choice.rank === next) keys.add(choice.key);
      }
      // Numeric parity is a plausible alternate explanation for a short odd series.
      if (round.family === 'number' && ranks.every((rank) => rank! % 2 === first % 2)) {
        for (const choice of round.choices) if (choice.rank !== undefined && choice.rank % 2 === first % 2) keys.add(choice.key);
      }
    }
  }
  if (round.family === 'direction' && round.terms.every((item) => item.rank !== undefined)) {
    const [first, second, third, fourth] = round.terms.map((item) => item.rank!);
    const step = (second - first + 4) % 4;
    if ((third - second + 4) % 4 === step && (fourth - third + 4) % 4 === step) {
      for (const choice of round.choices) if (choice.rank === (fourth + step) % 4) keys.add(choice.key);
    }
  }
  return keys;
}

export function validateRound(round: Round): boolean {
  const template = templates.find((item) => item.id === round.templateId && item.family === round.family && item.minTier <= round.tier && item.certificate);
  if (!template || round.terms.length !== 4 || round.choices.length !== (round.tier < 2 ? 3 : 4)) return false;
  if (round.answerKey !== template.answer.key || round.terms.some((item, i) => item.key !== template.terms[i].key)) return false;
  if (round.choices.filter((item) => item.key === round.answerKey).length !== 1) return false;
  if (new Set(round.choices.map((item) => item.key)).size !== round.choices.length) return false;
  const vocabulary = [...template.terms, template.answer, ...template.distractors];
  const hasValidCue = (item: Term) => vocabulary.some((known) => known.key === item.key && known.label === item.label && known.glyph === item.glyph && known.cue === item.cue && known.rank === item.rank);
  if (![...round.terms, ...round.choices].every(hasValidCue)) return false;
  if (new Set(round.choices.map((item) => `${item.label}|${item.cue}`)).size !== round.choices.length) return false;
  return [...plausibleKeys(round)].every((key) => key === round.answerKey);
}

export function makeRound(tier: Tier, family: Family, rng: Random = Math.random): Round {
  const eligible = templates.filter((item) => item.family === family && item.minTier <= tier);
  if (!eligible.length) throw new Error('No eligible puzzle template');
  for (let attempt = 0; attempt < 12; attempt++) {
    const template = eligible[pickIndex(eligible.length, rng)];
    const round: Round = {
      id: '', family, templateId: template.id, tier, terms: template.terms,
      choices: shuffle([template.answer, ...template.distractors.slice(0, tier < 2 ? 2 : 3)], rng),
      answerKey: template.answer.key, limitMs: tierSeconds[tier] * 1000, deadline: null,
    };
    if (validateRound(round)) return round;
  }
  const fallback = eligible[0];
  const round: Round = { id: '', family, templateId: fallback.id, tier, terms: fallback.terms, choices: [fallback.answer, ...fallback.distractors.slice(0, tier < 2 ? 2 : 3)], answerKey: fallback.answer.key, limitMs: tierSeconds[tier] * 1000, deadline: null };
  if (!validateRound(round)) throw new Error('No valid puzzle round');
  return round;
}
