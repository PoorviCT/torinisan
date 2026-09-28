import { describe, expect, it } from 'vitest';
import { createBestStore } from './best';

describe('browser-local best', () => {
  it('keeps the maximum across store instances and rejects malformed values', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const first = createBestStore(storage);
    expect(first.readBest()).toBe(0);
    expect(first.recordBest(7)).toBe(7);
    expect(createBestStore(storage).recordBest(3)).toBe(7);
    for (const invalid of ['-1', '3.1', 'Infinity', '9007199254740992', '003']) {
      values.set('dbc.bestChain.v1', invalid);
      expect(createBestStore(storage).readBest()).toBe(0);
    }
  });

  it('remains playable with memory best when storage throws', () => {
    const store = createBestStore({ getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(store.recordBest(5)).toBe(5);
    expect(store.recordBest(2)).toBe(5);
    expect(store.readBest()).toBe(5);
  });
});
