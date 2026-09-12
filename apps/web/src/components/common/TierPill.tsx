import { tierStyle } from "../../lib/tier";

interface TierPillProps {
  tier: string;
  rarity?: number;
  color?: string;
}

export function TierPill({ tier, rarity, color }: TierPillProps) {
  return (
    <span className="tier-pill" style={tierStyle(color ?? rarity ?? 0)}>
      {tier}
      {rarity !== undefined && ` ${rarity.toFixed(1)}`}
    </span>
  );
}
