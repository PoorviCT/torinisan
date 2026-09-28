// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Game from './game';
import { makeRound } from '../game/catalog';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('game screen', () => {
  it('starts a fresh timed round, accepts one keyboard answer and freezes on feedback', () => {
    render(<Game rng={() => 0} />);
    expect(screen.getByRole('button', { name: /play now/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /play now/i }));
    expect(screen.getByText('What comes next?')).toBeTruthy();
    expect(screen.getByLabelText('Missing next term')).toBeTruthy();
    const round = makeRound(0, 'color', () => 0);
    const index = round.choices.findIndex((choice) => choice.key === round.answerKey);
    fireEvent.keyDown(window, { key: 'abcd'[index] });
    expect(screen.getByText(/link added/i)).toBeTruthy();
    fireEvent.keyDown(window, { key: 'a' });
    expect(screen.getByText(/chain 1/i)).toBeTruthy();
  });
});
