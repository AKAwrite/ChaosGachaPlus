import { useEffect, useMemo, useRef, useState } from "react";

const ITEM_HEIGHT = 28;
/** Long fast sweep, then a slow crawl into place - the crawl is where the tension is. */
const SWEEP_MS = 2600;
const CRAWL_MS = 1500;
/** How many entries keep going past the winner, so you can see what you *nearly* got. */
const TAIL = 6;
/** Entries the crawl still has to travel after the sweep, i.e. the near-misses. */
const CRAWL_ITEMS = 3;

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
 * Slot-machine reel. Runs in two CSS transitions: a long fast sweep that stops
 * a few entries short of the winner, then a slow crawl over those last few so
 * the result creeps into the window instead of snapping to it. The strip
 * continues past the winner so it never looks like the list simply ran out.
 */
export function RollReel({ decoys, targetName, delayMs = 0, onDone }: RollReelProps) {
  const [offset, setOffset] = useState(0);
  const [durationMs, setDurationMs] = useState(SWEEP_MS);
  const done = useRef(false);

  const { strip, targetIndex } = useMemo(() => {
    if (decoys.length === 0) {
      return { strip: [targetName], targetIndex: 0 };
    }
    const lead = [...shuffled(decoys), ...shuffled(decoys), ...shuffled(decoys)];
    const tail = shuffled(decoys).slice(0, TAIL);
    return { strip: [...lead, targetName, ...tail], targetIndex: lead.length };
  }, [decoys, targetName]);

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

    const sweepIndex = Math.max(0, targetIndex - CRAWL_ITEMS);
    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        setDurationMs(SWEEP_MS);
        setOffset(-sweepIndex * ITEM_HEIGHT);
      }, delayMs + 30),
    );

    timers.push(
      window.setTimeout(() => {
        setDurationMs(CRAWL_MS);
        setOffset(-targetIndex * ITEM_HEIGHT);
      }, delayMs + SWEEP_MS),
    );

    // Safety net in case transitionend never fires (reduced motion, tab switch).
    timers.push(window.setTimeout(finish, delayMs + SWEEP_MS + CRAWL_MS + 250));

    return () => timers.forEach(window.clearTimeout);
  }, [targetIndex, delayMs, onDone]);

  return (
    <div className="reel" aria-label="Rolling">
      <div className="reel__window" />
      <div
        className="reel__strip"
        style={{
          transform: `translateY(${offset}px)`,
          transition: `transform ${durationMs}ms ${
            durationMs === SWEEP_MS ? "cubic-bezier(0.1, 0.62, 0.28, 1)" : "cubic-bezier(0.22, 0.9, 0.3, 1)"
          }`,
        }}
        onTransitionEnd={() => {
          // Only the final crawl ends the roll; the sweep is just the halfway point.
          if (durationMs === CRAWL_MS && !done.current) {
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
