import { isHighTier } from "@chaosgachaplus/shared";
import { tierStyle } from "../../lib/tier";
import { CategoryGlyph } from "../common/CategoryGlyph";
import { TierPill } from "../common/TierPill";
import type { ProposalOption } from "../../api/pulls";

const CATEGORY_LABELS: Record<string, string> = {
  ability: "Ability",
  item: "Item",
  familiar: "Familiar",
  trait: "Trait",
  skill: "Skill",
};

interface PullCardProps {
  option: ProposalOption;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: () => void;
}

export function PullCard({ option, selected = false, selectable = false, onSelect }: PullCardProps) {
  const className = [
    "pull-card",
    isHighTier(option.tier) ? "pull-card--flourish" : "",
    selectable ? "pull-card--selectable" : "",
    selected ? "pull-card--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {selected && <span className="pull-card__check" aria-hidden="true">✓</span>}
      <div className="pull-card__head">
        <TierPill tier={option.tier} color={option.color} />
        {/* The glyphs aren't a convention anyone knows yet, so name the kind outright at the moment of the pull. */}
        <span className="pull-card__kind">
          <CategoryGlyph category={option.category} size={18} className="glyph" />
          {CATEGORY_LABELS[option.category] ?? option.category}
        </span>
      </div>
      <div className="pull-card__name">{option.name}</div>
      <div className="pull-card__meta">
        <span>Rarity {option.rarity.toFixed(1)}</span>
        <span>{option.luckPercent.toFixed(2)}% odds</span>
      </div>
      <p className="pull-card__desc">{option.description}</p>
    </>
  );

  if (!selectable) {
    return (
      <div className={className} style={tierStyle(option.color)}>
        {content}
      </div>
    );
  }

  return (
    <button type="button" className={className} style={tierStyle(option.color)} onClick={onSelect} aria-pressed={selected}>
      {content}
    </button>
  );
}
