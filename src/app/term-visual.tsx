import type { Family, Term } from '../game/catalog';

function polygonPoints(sides: number): string {
  return Array.from({ length: sides }, (_, index) => {
    const angle = (2 * Math.PI * index) / sides - Math.PI / 2;
    return `${24 + 18 * Math.cos(angle)},${24 + 18 * Math.sin(angle)}`;
  }).join(' ');
}

export default function TermVisual({ term, family }: { term: Term; family: Family }) {
  if (family === 'color') return <span className="termContent colorTerm"><span className={`swatch swatch-${term.kind}`} aria-hidden="true" /><span className="termLabel">{term.label}</span></span>;
  if (family === 'size') return <span className="termContent sizeTerm"><span className="sizeTrack" aria-hidden="true"><span className="sizeBar" style={{ width: `${25 + (term.rank ?? 0) * 14}%` }} /></span><span className="termLabel">{term.label}</span></span>;
  if (family === 'shape') return <span className="termContent shapeTerm"><svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true"><polygon points={polygonPoints(term.rank ?? 3)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /></svg><span className="termLabel">{term.label}</span></span>;
  return <span className={`termContent ${family}Term`}><span className="termGlyph" aria-hidden="true">{term.glyph}</span>{family !== 'number' && <span className="termLabel">{term.label}</span>}</span>;
}
