import { useEffect, useMemo, useRef, useState } from "react";

const ITEM_HEIGHT = 28;
const SPIN_MS = 2400;

function shuffled(source: string[]): string[] {
  const copy = [...source];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface RollReelProps {
  decoys: string[];
  targetName: string;
  /** Staggers reels when several tickets are rolled at once. */
  delayMs?: number;
  onDone: () => void;
}

/**
 * Slot-machine reel: spins through names from the same pool and decelerates
 * onto the real result. Pure CSS transform transition - the deceleration is
 * the easing curve, so it stays smooth without a JS animation loop.
 */
export function RollReel({ decoys, targetName, delayMs = 0, onDone }: RollReelProps) {
  const [offset, setOffset] = useState(0);
  const done = useRef(false);

  const strip = useMemo(() => {
    const filler = decoys.length > 0 ? [...shuffled(decoys), ...shuffled(decoys), ...shuffled(decoys)] : [];
    return [...filler, targetName];
  }, [decoys, targetName]);

  const targetIndex = strip.length - 1;

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      onDone();
    };

    if (targetIndex === 0) {
      finish();
      return;
    }

    const start = window.setTimeout(() => setOffset(-targetIndex * ITEM_HEIGHT), delayMs + 30);
    // Safety net in case transitionend never fires (reduced motion, tab switch).
    const guard = window.setTimeout(finish, delayMs + SPIN_MS + 250);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(guard);
    };
  }, [targetIndex, delayMs, onDone]);

  return (
    <div className="reel" aria-label="Rolling">
      <div className="reel__window" />
      <div
        className="reel__strip"
        style={{
          transform: `translateY(${offset}px)`,
          transition: `transform ${SPIN_MS}ms cubic-bezier(0.08, 0.82, 0.17, 1)`,
        }}
        onTransitionEnd={() => {
          if (!done.current) {
            done.current = true;
            onDone();
          }
        }}
      >
        {strip.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className={`reel__item${index === targetIndex ? " reel__item--target" : ""}`}
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
