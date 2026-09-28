import { describe, expect, it } from 'vitest';
import { chooseFamily, families, makeRound, validateRound } from './catalog';

const randomValues = [0, 0.17, 0.49, 0.83, 0.999];

describe('curated puzzle catalog', () => {
  it('offers a unique, accessible answer in every eligible family and tier', () => {
    for (const tier of [0, 1, 2, 3, 4] as const) {
      for (const family of families) {
        if (tier === 0 && (family === 'shape' || family === 'size')) continue;
        for (const value of randomValues) {
          const round = makeRound(tier, family, () => value);
          expect(validateRound(round)).toBe(true);
          expect(round.terms).toHaveLength(4);
          expect(round.choices).toHaveLength(tier < 2 ? 3 : 4);
          expect(round.choices.filter((choice) => choice.key === round.answerKey)).toHaveLength(1);
          expect(round.terms.every((term) => term.label && term.cue)).toBe(true);
        }
      }
    }
  });

  it('rejects a competing answer, duplicate identity, and missing cue', () => {
    const round = makeRound(2, 'number', () => 0);
    expect(validateRound({ ...round, choices: [round.choices[0], round.choices[0], ...round.choices.slice(2)] })).toBe(false);
    expect(validateRound({ ...round, choices: round.choices.map((choice) => ({ ...choice, cue: '' })) })).toBe(false);
    const alternate = { key: 'number:11', label: '11', glyph: '11', cue: 'number eleven', rank: 11 };
    expect(validateRound({ ...round, choices: [alternate, ...round.choices.slice(1)] })).toBe(false);
  });

  it('offers curated higher-pressure variants in every family', () => {
    for (const family of families) {
      const basic = makeRound(4, family, () => 0);
      const advanced = makeRound(4, family, () => 0.999);
      expect(advanced.templateId).not.toBe(basic.templateId);
      expect(validateRound(advanced)).toBe(true);
    }
  });

  it('rotates without selecting the previous family and keeps all six reachable', () => {
    const seen = new Set<string>();
    for (const family of families) {
      seen.add(chooseFamily(2, null, () => families.indexOf(family) / families.length));
      expect(chooseFamily(4, family, () => 0)).not.toBe(family);
    }
    expect(seen).toEqual(new Set(families));
  });
});
