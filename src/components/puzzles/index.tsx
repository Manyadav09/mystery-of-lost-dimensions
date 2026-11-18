/* Puzzle dispatcher — routes a level to its puzzle module */
import { SymbolMatch, SequencePuzzle, CombinationLock, PatternPuzzle } from './ClassicPuzzles';
import { CrystalAlign, LaserPuzzle, GearTrain, GlyphEcho } from './MechaPuzzles';
import { FinalePuzzle } from './FinalePuzzle';
import type { LevelDef } from '../../game/levels';

export { PuzzleModal } from './PuzzleModal';

export function PuzzleBody({ level, onSolve }: { level: LevelDef; onSolve: () => void }) {
  const p = level.puzzle as never;
  switch (level.type) {
    case 'symbol':      return <SymbolMatch cfg={p} onSolve={onSolve} />;
    case 'sequence':    return <SequencePuzzle cfg={p} onSolve={onSolve} />;
    case 'combination': return <CombinationLock cfg={p} onSolve={onSolve} />;
    case 'crystal':     return <CrystalAlign cfg={p} onSolve={onSolve} />;
    case 'laser':       return <LaserPuzzle cfg={p} onSolve={onSolve} />;
    case 'gears':       return <GearTrain cfg={p} onSolve={onSolve} />;
    case 'pattern':     return <PatternPuzzle cfg={p} onSolve={onSolve} />;
    case 'simon':       return <GlyphEcho cfg={p} onSolve={onSolve} />;
    case 'finale':      return <FinalePuzzle cfg={p} onSolve={onSolve} />;
    case 'hidden':      return null; // hidden-relic levels complete via 3D interaction
    default:            return null;
  }
}
