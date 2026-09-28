import { tierOf, validateRound, type Family, type Round } from './catalog';

export type Phase = 'start' | 'play' | 'correct' | 'break' | 'result' | 'generation-error';
export type GameState = {
  phase: Phase;
  runId: string;
  chain: number;
  best: number;
  round: Round | null;
  lastFamily: Family | null;
  correctSinceRotation: number;
  feedbackEpoch: number;
  failureReason: 'wrong' | 'timeout' | null;
};
export type Action =
  | { type: 'loadBest'; best: number }
  | { type: 'start'; runId: string; round: Round }
  | { type: 'activate'; runId: string; roundId: string; now: number }
  | { type: 'choice'; runId: string; roundId: string; key: string; now: number }
  | { type: 'expiry'; runId: string; roundId: string; now: number }
  | { type: 'feedbackDone'; runId: string; epoch: number; round?: Round }
  | { type: 'recordBest'; runId: string; best: number }
  | { type: 'generationError'; runId: string };

export const initialGame: GameState = {
  phase: 'start', runId: '', chain: 0, best: 0, round: null,
  lastFamily: null, correctSinceRotation: 0, feedbackEpoch: 0, failureReason: null,
};

export function combo(chain: number): string | null {
  return chain >= 10 ? '×4' : chain >= 6 ? '×3' : chain >= 3 ? '×2' : null;
}

export function reduceGame(state: GameState, action: Action): GameState {
  if (action.type === 'loadBest') return { ...state, best: Math.max(state.best, action.best) };
  if (action.type === 'start') {
    if (!validateRound(action.round) || action.round.tier !== 0) return { ...state, phase: 'generation-error' };
    return { ...initialGame, best: state.best, phase: 'play', runId: action.runId, round: action.round, lastFamily: action.round.family };
  }
  if (action.runId !== state.runId) return state;
  if (action.type === 'generationError') return { ...state, phase: 'generation-error', round: null };
  if (action.type === 'recordBest') {
    if (state.phase !== 'break' && state.phase !== 'result') return state;
    return { ...state, best: Math.max(state.best, action.best) };
  }
  if (action.type === 'feedbackDone') {
    if (action.epoch !== state.feedbackEpoch) return state;
    if (state.phase === 'break') return { ...state, phase: 'result', round: null };
    if (state.phase !== 'correct' || !action.round || !validateRound(action.round) || action.round.tier !== tierOf(state.chain)) return state;
    return { ...state, phase: 'play', round: action.round, lastFamily: action.round.family };
  }
  if (state.phase !== 'play' || !state.round || action.roundId !== state.round.id) return state;
  if (action.type === 'activate') {
    if (state.round.deadline !== null) return state;
    return { ...state, round: { ...state.round, deadline: action.now + state.round.limitMs } };
  }
  if (state.round.deadline === null) return state;
  if (action.type === 'choice' && !state.round.choices.some((choice) => choice.key === action.key)) return state;
  const reason = action.now >= state.round.deadline ? 'timeout'
    : action.type === 'expiry' ? null
    : action.key === state.round.answerKey ? 'correct' : 'wrong';
  if (!reason) return state;
  if (reason === 'correct') return {
    ...state, phase: 'correct', chain: state.chain + 1,
    correctSinceRotation: (state.correctSinceRotation + 1) % 3,
    feedbackEpoch: state.feedbackEpoch + 1,
  };
  return { ...state, phase: 'break', failureReason: reason, feedbackEpoch: state.feedbackEpoch + 1 };
}
