import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CONCRETE_GACHA_CATEGORIES, type ConcreteGachaCategory } from "@chaosgachaplus/shared";
import { useStory } from "../hooks/useStories";
import {
  useCreateCustomization,
  useCustomizations,
  useDeleteCustomization,
  useEntries,
  useUpdateCustomization,
} from "../hooks/useEntries";
import type { CustomizationDTO, GachaEntryDTO } from "../api/entries";

function OverrideForm({
  entry,
  existing,
  onSave,
  onCancel,
}: {
  entry: GachaEntryDTO;
  existing?: CustomizationDTO;
  onSave: (values: { name: string; rarity: number; description: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? entry.name);
  const [rarity, setRarity] = useState(String(existing?.rarity ?? entry.rarity));
  const [description, setDescription] = useState(existing?.description ?? entry.description);

  return (
    <div className="override-form">
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" step="0.1" min="0" max="10" value={rarity} onChange={(e) => setRarity(e.target.value)} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      <div>
        <button type="button" onClick={() => onSave({ name, rarity: Number(rarity), description })}>
          Save override
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function EntriesPage() {
  const { storyId } = useParams<{ storyId?: string }>();
  const { data: story } = useStory(storyId);
  const [category, setCategory] = useState<ConcreteGachaCategory>("ability");
  const [search, setSearch] = useState("");
  const { data: entries, isLoading } = useEntries(category, search);
  const { data: customizations } = useCustomizations(storyId);
  const createCustomization = useCreateCustomization(storyId);
  const updateCustomization = useUpdateCustomization(storyId);
  const deleteCustomization = useDeleteCustomization(storyId);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customRarity, setCustomRarity] = useState("1.0");
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState<ConcreteGachaCategory>("ability");

  const customizationByBaseId = new Map((customizations ?? []).filter((c) => c.baseEntryId).map((c) => [c.baseEntryId!, c]));
  const customEntries = (customizations ?? []).filter((c) => !c.baseEntryId);

  async function handleAddCustom(event: FormEvent) {
    event.preventDefault();
    if (!customName.trim()) return;
    await createCustomization.mutateAsync({
      storyId: storyId ?? null,
      category: customCategory,
      name: customName.trim(),
      rarity: Number(customRarity),
      description: customDescription.trim(),
    });
    setCustomName("");
    setCustomDescription("");
  }

  function toggleExclude(entry: GachaEntryDTO) {
    const existing = customizationByBaseId.get(entry.id);
    if (existing) {
      updateCustomization.mutate({ id: existing.id, input: { isExcluded: !existing.isExcluded } });
    } else {
      createCustomization.mutate({
        storyId: storyId ?? null,
        baseEntryId: entry.id,
        category: entry.category,
        isExcluded: true,
      });
    }
  }

  return (
    <main>
      <header className="app-header">
        <div>
          {storyId ? (
            <Link to={`/stories/${storyId}`}>&larr; {story?.title ?? "Back to story"}</Link>
          ) : (
            <Link to="/stories">&larr; Your stories</Link>
          )}
          <h1>{storyId ? "Story entries" : "Your entries (all stories)"}</h1>
        </div>
      </header>
      <p>
        Changes here are private to your account{storyId ? " and only apply to this story" : " and apply across all your stories (unless a story overrides them)"}.
      </p>

      <h2>Your custom entries ({customEntries.length})</h2>
      <form onSubmit={handleAddCustom} className="ticket-form">
        <label>
          Category
          <select value={customCategory} onChange={(e) => setCustomCategory(e.target.value as ConcreteGachaCategory)}>
            {CONCRETE_GACHA_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} required />
        </label>
        <label>
          Rarity
          <input type="number" step="0.1" min="0" max="10" value={customRarity} onChange={(e) => setCustomRarity(e.target.value)} />
        </label>
        <label>
          Description
          <textarea value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} rows={2} />
        </label>
        <button type="submit" disabled={createCustomization.isPending}>
          Add custom entry
        </button>
      </form>
      <ul className="entity-list">
        {customEntries.map((c) => (
          <li key={c.id}>
            <span>
              <strong>{c.name}</strong> ({c.rarity?.toFixed(1)}) — {c.category}
              {c.isExcluded ? " [disabled]" : ""}
            </span>
            <span>
              <button type="button" onClick={() => updateCustomization.mutate({ id: c.id, input: { isExcluded: !c.isExcluded } })}>
                {c.isExcluded ? "Enable" : "Disable"}
              </button>
              <button type="button" className="danger" onClick={() => deleteCustomization.mutate(c.id)}>
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>

      <h2>Official entries</h2>
      <div className="inline-form">
        <select value={category} onChange={(e) => setCategory(e.target.value as ConcreteGachaCategory)}>
          {CONCRETE_GACHA_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input type="text" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading && <p>Loading...</p>}
      <ul className="entity-list">
        {entries?.map((entry) => {
          const override = customizationByBaseId.get(entry.id);
          return (
            <li key={entry.id} className="entry-row">
              <div className="entry-row__main">
                <span>
                  <strong>{override?.name ?? entry.name}</strong> ({(override?.rarity ?? entry.rarity).toFixed(1)})
                  {override && !override.isExcluded ? " [overridden]" : ""}
                  {override?.isExcluded ? " [excluded]" : ""}
                </span>
                <span>
                  <button type="button" onClick={() => toggleExclude(entry)}>
                    {override?.isExcluded ? "Include" : "Exclude"}
                  </button>
                  <button type="button" onClick={() => setEditingEntryId(editingEntryId === entry.id ? null : entry.id)}>
                    {editingEntryId === entry.id ? "Close" : "Override"}
                  </button>
                  {override && (
                    <button type="button" className="danger" onClick={() => deleteCustomization.mutate(override.id)}>
                      Reset
                    </button>
                  )}
                </span>
              </div>
              {editingEntryId === entry.id && (
                <OverrideForm
                  entry={entry}
                  existing={override}
                  onCancel={() => setEditingEntryId(null)}
                  onSave={(values) => {
                    if (override) {
                      updateCustomization.mutate({ id: override.id, input: values });
                    } else {
                      createCustomization.mutate({
                        storyId: storyId ?? null,
                        baseEntryId: entry.id,
                        category: entry.category,
                        ...values,
                      });
                    }
                    setEditingEntryId(null);
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
