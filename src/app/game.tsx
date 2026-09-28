'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { chooseFamily, makeRound, tierNames, tierOf, tierSeconds, type Random, type Round } from '../game/catalog';
import { createBestStore } from '../game/best';
import { combo, initialGame, reduceGame, type Action, type GameState } from '../game/run';
import TermVisual from './term-visual';

const feedbackMs = 800;
const shortcuts = 'abcd';

export default function Game({ rng = Math.random }: { rng?: Random }) {
  const [game, setGame] = useState<GameState>(initialGame);
  const gameRef = useRef<GameState>(initialGame);
  const storeRef = useRef(createBestStore());
  const serialRef = useRef(0);
  const [remaining, setRemaining] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const announcedRoundRef = useRef('');

  const dispatch = useCallback((action: Action) => {
    const next = reduceGame(gameRef.current, action);
    if (next !== gameRef.current) {
      gameRef.current = next;
      setGame(next);
    }
  }, []);

  useEffect(() => {
    try { storeRef.current = createBestStore(window.localStorage); } catch { /* memory fallback */ }
    dispatch({ type: 'loadBest', best: storeRef.current.readBest() });
  }, [dispatch]);

  function startGame() {
    const runId = `run-${++serialRef.current}`;
    try {
      const family = chooseFamily(0, null, rng);
      const round = { ...makeRound(0, family, rng), id: `${runId}-1` };
      setAnnouncement('');
      dispatch({ type: 'start', runId, round });
    } catch {
      dispatch({ type: 'generationError', runId: gameRef.current.runId });
    }
  }

  function choose(key: string) {
    const current = gameRef.current;
    if (current.phase !== 'play' || current.round?.deadline === null || !current.round) return;
    dispatch({ type: 'choice', runId: current.runId, roundId: current.round.id, key, now: performance.now() });
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.isComposing) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return;
      const index = shortcuts.indexOf(event.key.toLowerCase());
      const current = gameRef.current;
      if (current.phase === 'play' && index >= 0 && index < (current.round?.choices.length ?? 0)) {
        event.preventDefault();
        choose(current.round!.choices[index].key);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const activeRound = game.round;
  const activeId = activeRound?.id;
  const deadline = activeRound?.deadline;
  useEffect(() => {
    if (game.phase !== 'play' || !activeRound) return;
    if (deadline == null) {
      dispatch({ type: 'activate', runId: game.runId, roundId: activeRound.id, now: performance.now() });
      return;
    }
    const roundId = activeRound.id;
    const runId = game.runId;
    function updateClock() {
      const now = performance.now();
      const left = Math.max(0, deadline! - now);
      setRemaining(left);
      if (left <= 5000 && left > 0 && announcedRoundRef.current !== roundId) {
        announcedRoundRef.current = roundId;
        setAnnouncement('5 seconds remaining');
      }
      if (now >= deadline!) dispatch({ type: 'expiry', runId, roundId, now });
    }
    updateClock();
    const interval = window.setInterval(updateClock, 100);
    const timeout = window.setTimeout(updateClock, Math.max(0, deadline - performance.now()));
    document.addEventListener('visibilitychange', updateClock);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', updateClock);
    };
  }, [game.phase, game.runId, activeId, activeRound, deadline, dispatch]);

  useEffect(() => {
    if (game.phase !== 'break') return;
    const best = storeRef.current.recordBest(game.chain);
    dispatch({ type: 'recordBest', runId: game.runId, best });
  }, [game.phase, game.runId, game.chain, dispatch]);

  useEffect(() => {
    if (game.phase !== 'correct' && game.phase !== 'break') return;
    const runId = game.runId;
    const epoch = game.feedbackEpoch;
    const isCorrect = game.phase === 'correct';
    const timeout = window.setTimeout(() => {
      if (!isCorrect) {
        dispatch({ type: 'feedbackDone', runId, epoch });
        return;
      }
      const current = gameRef.current;
      if (current.runId !== runId || current.phase !== 'correct' || current.feedbackEpoch !== epoch) return;
      try {
        const tier = tierOf(current.chain);
        const family = current.correctSinceRotation === 0
          ? chooseFamily(tier, current.lastFamily, rng)
          : current.lastFamily!;
        const round: Round = { ...makeRound(tier, family, rng), id: `${runId}-${current.chain + 1}` };
        setAnnouncement('');
        dispatch({ type: 'feedbackDone', runId, epoch, round });
      } catch {
        dispatch({ type: 'generationError', runId });
      }
    }, feedbackMs);
    return () => window.clearTimeout(timeout);
  }, [game.phase, game.runId, game.feedbackEpoch, dispatch, rng]);

  const tier = activeRound?.tier ?? tierOf(game.chain);
  const timeLeft = game.phase === 'play' && deadline !== null
    ? Math.ceil(remaining / 1000) : activeRound ? Math.ceil((remaining || activeRound.limitMs) / 1000) : 0;
  const timeProgress = game.phase === 'play' && deadline !== null
    ? Math.max(0, remaining / activeRound!.limitMs * 100) : 0;

  return (
    <div className="siteShell">
      <header className="siteHeader"><div className="brand">DON’T BREAK <span>THE CHAIN</span></div><div className="headerTag">A QUICK PATTERN GAME <span className="headerDot" /></div></header>
      {game.phase === 'start' && <main className="startStage">
        <section className="heroCopy">
          <p className="eyebrow"><span className="eyebrowLine" /> ONE ANSWER AT A TIME</p>
          <h1>Find the rule.<br /><em>Keep the chain.</em></h1>
          <p className="heroDescription">Choose the next tile before time runs out. Every right answer adds one link. One miss ends the run.</p>
          <button className="primaryButton" onClick={startGame}>Play now <span aria-hidden="true">↗</span></button>
          <p className="subnote">NO ACCOUNT NEEDED <span aria-hidden="true">·</span> YOUR BEST STAYS HERE</p>
        </section>
        <section className="previewCard" aria-label="Your best chain">
          <div className="previewTop"><span>YOUR BEST CHAIN</span><strong>{String(game.best).padStart(2, '0')}</strong></div>
          <div className="previewLinks" aria-hidden="true"><ChainLinks count={7} large /></div>
          <div className="previewBottom"><div><span>THE IDEA</span><p>Spot the pattern.<br />Protect your streak.</p></div><span className="previewQuestion" aria-hidden="true">?</span></div>
        </section>
      </main>}
      {(game.phase === 'play' || game.phase === 'correct' || game.phase === 'break') && activeRound && <main className="playStage">
        <aside className="runStatus" aria-label="Run status">
          <div><span className="statusLabel">CURRENT CHAIN</span><div className="scoreNumber">{String(game.chain).padStart(2, '0')}</div><div className="scoreLinks" aria-hidden="true"><ChainLinks count={Math.min(game.chain, 7)} /></div>
            {combo(game.chain) && <p className="comboLabel">COMBO {combo(game.chain)} <span>visual streak</span></p>}
          </div>
          <div className="tierInfo"><span className="statusLabel">DIFFICULTY</span><strong>{tierNames[tier]}</strong><span>Chain {['0–3', '4–7', '8–12', '13–20', '21+'][tier]} · {tierSeconds[tier]} seconds</span></div>
        </aside>
        <section className="puzzlePanel" aria-labelledby="puzzleHeading">
          <div className="panelTop"><span className="sectionKicker"><span className="smallSquare" /> NEXT IN THE SEQUENCE</span><div className="clock"><span>TIME LEFT</span><strong role="timer" aria-label={`Time left ${timeLeft} seconds`}>{timeLeft}s</strong></div></div>
          <div className="timerTrack" aria-hidden="true"><div className="timerFill" style={{ width: `${timeProgress}%` }} /></div>
          {game.phase === 'play' ? <>
            <div className="questionHeader"><span className="roundLabel">ROUND {String(game.chain + 1).padStart(2, '0')}</span><h1 id="puzzleHeading">What comes next?</h1><p>Find the missing piece to keep your chain alive.</p></div>
            <ol className="sequence" aria-label="Sequence to complete">{activeRound.terms.map((term, index) => <li className="sequenceTile" key={`${term.key}-${index}`} aria-label={`${term.label}, ${term.cue}`}><TermVisual term={term} family={activeRound.family} /></li>)}<li className="missingTile" aria-label="Missing next term">?</li></ol>
            <div className="choicesHeader"><h2>Choose one</h2><span>Tap or press A–D</span></div>
            <div className="choices" role="group" aria-label="Answer choices">{activeRound.choices.map((term, index) => <button key={term.key} className="answerButton" type="button" disabled={deadline === null} onClick={() => choose(term.key)} aria-label={`${shortcuts[index].toUpperCase()}, ${term.label}, ${term.cue}`}><span className="choiceLetter">{shortcuts[index].toUpperCase()}</span><TermVisual term={term} family={activeRound.family} /></button>)}</div>
          </> : <div className={`feedbackPanel ${game.phase === 'break' ? 'isBreak' : ''}`} role={game.phase === 'break' ? 'alert' : 'status'}>
            <div className="feedbackSymbol" aria-hidden="true">{game.phase === 'correct' ? '↗' : '×'}</div>
            <p className="sectionKicker">{game.phase === 'correct' ? 'ONE MORE LINK' : 'THE CHAIN BROKE'}</p>
            <h1 id="puzzleHeading">{game.phase === 'correct' ? 'Link added.' : game.failureReason === 'timeout' ? 'Time ran out.' : 'Wrong answer.'}</h1>
            <p>{game.phase === 'correct' ? `Chain ${game.chain}. Keep it going.` : `Chain broken at ${game.chain}.`}</p>
          </div>}
          <p className="visuallyHidden" aria-live="polite" aria-atomic="true">{announcement}</p>
        </section>
      </main>}
      {game.phase === 'result' && <main className="resultStage"><section className="resultCard"><span className="resultIcon" aria-hidden="true">×</span><p className="eyebrow">RUN COMPLETE</p><h1>Chain broken.<br /><em>Go again?</em></h1><p className="resultReason">{game.failureReason === 'timeout' ? 'Time ran out before your answer.' : 'One wrong answer ended the run.'}</p><div className="resultStats"><div><span>YOUR CHAIN</span><strong>{String(game.chain).padStart(2, '0')}</strong></div><div><span>YOUR BEST</span><strong>{String(game.best).padStart(2, '0')}</strong></div></div><button className="primaryButton" onClick={startGame}>Play again <span aria-hidden="true">↗</span></button></section></main>}
      {game.phase === 'generation-error' && <main className="resultStage"><section className="resultCard"><h1>Round unavailable.</h1><p>We couldn’t make a fair puzzle. Try a fresh run.</p><button className="primaryButton" onClick={startGame}>Try again <span aria-hidden="true">↗</span></button></section></main>}
      <footer className="siteFooter"><span>ONE CHAIN. NO SECOND CHANCES.</span><span>BEST SCORE IS DEVICE-SPECIFIC.</span></footer>
    </div>
  );
}

function ChainLinks({ count, large = false }: { count: number; large?: boolean }) {
  return <>{Array.from({ length: count }, (_, index) => <span key={index} className={`chainLink ${large ? 'chainLinkLarge' : ''}`} />)}</>;
}
