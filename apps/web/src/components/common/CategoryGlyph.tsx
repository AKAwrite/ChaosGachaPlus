import type { ReactElement } from "react";
import type { ConcreteGachaCategory, GachaCategory } from "@chaosgachaplus/shared";

const PATHS: Record<ConcreteGachaCategory, ReactElement> = {
  // Lightning - raw power
  ability: <path d="M13 2.5 5 13.5h6l-1 8 9-11h-6z" />,
  // Cut gem - treasure
  item: (
    <>
      <path d="M12 21 3 8.5 6.5 3h11L21 8.5z" />
      <path d="M3 8.5h18" />
    </>
  ),
  // Paw - companions
  familiar: (
    <>
      <circle cx="7.5" cy="9.5" r="1.9" />
      <circle cx="12" cy="7.5" r="1.9" />
      <circle cx="16.5" cy="9.5" r="1.9" />
      <path d="M12 12.5c-2.9 0-5.2 2.2-5.2 4.5 0 1.6 1.2 2.5 2.8 2.5.9 0 1.7-.4 2.4-.4s1.5.4 2.4.4c1.6 0 2.8-.9 2.8-2.5 0-2.3-2.3-4.5-5.2-4.5z" />
    </>
  ),
  // Sigil - innate nature
  trait: (
    <>
      <path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // Bullseye - trained mastery
  skill: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="3.6" />
    </>
  ),
};

interface CategoryGlyphProps {
  category: GachaCategory;
  size?: number;
  className?: string;
}

export function CategoryGlyph({ category, size = 20, className }: CategoryGlyphProps) {
  const path = PATHS[category as ConcreteGachaCategory];
  if (!path) {
    // "random" tickets have no concrete category until they're rolled.
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.5v17M3.5 12h17" />
        <circle cx="12" cy="12" r="8.2" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}
