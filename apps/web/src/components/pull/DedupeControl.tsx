import type { DedupeMode } from "@chaosgachaplus/shared";
import { useUpdateStory } from "../../hooks/useStories";

const OPTIONS: Array<{ value: DedupeMode; label: string; hint: string }> = [
  { value: "off", label: "Allow", hint: "Rolls can repeat anything." },
  { value: "character", label: "Per character", hint: "Never rolls something this character already holds." },
  { value: "story", label: "Per story", hint: "Never rolls something anyone in this story already holds." },
];

export function DedupeControl({ storyId, mode }: { storyId: string; mode: DedupeMode }) {
  const updateStory = useUpdateStory(storyId);
  const active = OPTIONS.find((option) => option.value === mode) ?? OPTIONS[0];

  return (
    <div className="dedupe">
      <div className="row">
        <span className="dedupe__label">Duplicates</span>
        <div className="seg">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              disabled={updateStory.isPending}
              onClick={() => updateStory.mutate({ dedupeMode: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <span className="dim">
        {active.hint} Consumed entries can come back. Applies to the whole story.
      </span>
    </div>
  );
}
