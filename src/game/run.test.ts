import { describe, expect, it } from 'vitest';
import { makeRound } from './catalog';
import { combo, initialGame, reduceGame } from './run';

const puzzle = (id: string, tier = 0 as const) => ({ ...makeRound(tier, 'number', () => 0), id });
const started = () => reduceGame(initialGame, { type: 'start', runId: 'run-1', round: puzzle('1') });
const active = () => reduceGame(started(), { type: 'activate', runId: 'run-1', roundId: '1', now: 100 });

function answer(state: ReturnType<typeof active>, key: string, now: number) {
  return reduceGame(state, { type: 'choice', runId: 'run-1', roundId: '1', key, now });
}

describe('run lifecycle', () => {
  it('adds exactly one link and accepts only the first answer', () => {
    const state = active();
    const correct = answer(state, state.round!.answerKey, 12_099);
    expect(correct.phase).toBe('correct');
    expect(correct.chain).toBe(1);
    expect(answer(correct as ReturnType<typeof active>, 'wrong', 12_099)).toBe(correct);
    expect(reduceGame(correct, { type: 'feedbackDone', runId: 'run-1', epoch: correct.feedbackEpoch, round: puzzle('2') }).phase).toBe('play');
  });

  it('awards timeout priority exactly at deadline, even if click is first', () => {
    const state = active();
    const expired = answer(state, state.round!.answerKey, 12_100);
    expect(expired.phase).toBe('break');
    expect(expired.failureReason).toBe('timeout');
    expect(expired.chain).toBe(0);
    const atEnd = reduceGame(state, { type: 'expiry', runId: 'run-1', roundId: '1', now: 12_100 });
    expect(answer(atEnd as ReturnType<typeof active>, state.round!.answerKey, 12_100)).toBe(atEnd);
    expect(reduceGame(state, { type: 'expiry', runId: 'run-1', roundId: '1', now: 12_099 })).toBe(state);
  });

  it('ends on wrong choice and ignores stale callbacks after replay', () => {
    const state = active();
    expect(answer(state, 'not-an-answer', 101)).toBe(state);
    const failed = answer(state, state.round!.choices.find((choice) => choice.key !== state.round!.answerKey)!.key, 101);
    expect(failed.phase).toBe('break');
    const result = reduceGame(failed, { type: 'feedbackDone', runId: 'run-1', epoch: failed.feedbackEpoch });
    expect(result.phase).toBe('result');
    const restarted = reduceGame(result, { type: 'start', runId: 'run-2', round: puzzle('1') });
    expect(restarted.chain).toBe(0);
    expect(restarted.round!.deadline).toBeNull();
    expect(reduceGame(restarted, { type: 'expiry', runId: 'run-1', roundId: '1', now: 99999 })).toBe(restarted);
    expect(reduceGame(restarted, { type: 'feedbackDone', runId: 'run-1', epoch: failed.feedbackEpoch })).toBe(restarted);
  });

  it('tracks tier boundaries, rotation counts, and visual-only combos', () => {
    let state = started();
    for (let i = 0; i < 21; i++) {
      state = reduceGame(state, { type: 'activate', runId: 'run-1', roundId: String(i + 1), now: i * 20000 });
      state = reduceGame(state, { type: 'choice', runId: 'run-1', roundId: String(i + 1), key: state.round!.answerKey, now: i * 20000 + 1 });
      expect(state.chain).toBe(i + 1);
      expect(state.correctSinceRotation).toBe((i + 1) % 3);
      if (i < 20) {
        const next = { ...makeRound((state.chain <= 3 ? 0 : state.chain <= 7 ? 1 : state.chain <= 12 ? 2 : state.chain <= 20 ? 3 : 4), 'number', () => 0), id: String(i + 2) };
        state = reduceGame(state, { type: 'feedbackDone', runId: 'run-1', epoch: state.feedbackEpoch, round: next });
      }
    }
    expect(state.chain).toBe(21);
    expect(combo(2)).toBeNull();
    expect([3, 5, 6, 9, 10].map(combo)).toEqual(['×2', '×2', '×3', '×3', '×4']);
  });
});
