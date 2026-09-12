import type { CSSProperties } from "react";
import { isHighTier } from "@chaosgachaplus/shared";
import type { ProposalOption } from "../../api/pulls";

interface PullCardProps {
  option: ProposalOption;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: () => void;
}

export function PullCard({ option, selected, selectable, onSelect }: PullCardProps) {
  const flourish = isHighTier(option.tier);

  return (
    <button
      type="button"
      className={`pull-card${flourish ? " pull-card--flourish" : ""}${selected ? " pull-card--selected" : ""}`}
      style={{ "--tier-color": option.color } as CSSProperties}
      onClick={selectable ? onSelect : undefined}
      disabled={!selectable}
    >
      <span className="pull-card__tier">{option.tier}</span>
      <span className="pull-card__name">{option.name}</span>
      <span className="pull-card__meta">
        {option.category} · rarity {option.rarity.toFixed(1)} · {option.luckPercent.toFixed(2)}% luck
      </span>
      <p className="pull-card__description">{option.description}</p>
    </button>
  );
}
