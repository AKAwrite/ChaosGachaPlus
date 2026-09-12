import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CONCRETE_GACHA_CATEGORIES, TIER_BANDS, type ConcreteGachaCategory } from "@chaosgachaplus/shared";
import { useStory } from "../hooks/useStories";
import {
  useCreateCustomization,
  useCustomizations,
  useDeleteCustomization,
  useEntries,
  useUpdateCustomization,
} from "../hooks/useEntries";
import type { CustomizationDTO, GachaEntryDTO } from "../api/entries";
import { AppShell } from "../components/common/AppShell";
import { Collapsible } from "../components/common/Collapsible";
import { CategoryGlyph } from "../components/common/CategoryGlyph";
import { TierPill } from "../components/common/TierPill";
import { tierName, tierStyle } from "../lib/tier";

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
      <div className="field-row">
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Rarity
          <input type="number" step="0.1" min="0" max="10" value={rarity} onChange={(e) => setRarity(e.target.value)} />
        </label>
      </div>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </label>
      <div className="row">
        <button type="button" className="btn-primary btn-sm" onClick={() => onSave({ name, rarity: Number(rarity), description })}>
          Save override
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>
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
  const [tiers, setTiers] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<"name-asc" | "name-desc" | "rarity-desc" | "rarity-asc">("name-asc");
  const [limit, setLimit] = useState(50);
  const [sort, dir] = sortKey.split("-") as ["name" | "rarity", "asc" | "desc"];
  const { data: entryPage, isLoading } = useEntries({
    category,
    search: search || undefined,
    tiers,
    sort,
    dir,
    limit,
  });
  const entries = entryPage?.entries;
  const { data: customizations } = useCustomizations(storyId);
  const createCustomization = useCreateCustomization(storyId);
  const updateCustomization = useUpdateCustomization(storyId);
  const deleteCustomization = useDeleteCustomization(storyId);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customRarity, setCustomRarity] = useState("3.0");
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState<ConcreteGachaCategory>("ability");

  const byBaseId = new Map((customizations ?? []).filter((c) => c.baseEntryId).map((c) => [c.baseEntryId!, c]));
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
    const existing = byBaseId.get(entry.id);
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
    <AppShell>
      <main className="page">
        <div className="page-head">
          <div>
            <div className="page-head__sub">
              {storyId ? (
                <Link to={`/stories/${storyId}`}>&larr; {story?.title ?? "Back to story"}</Link>
              ) : (
                <Link to="/stories">&larr; All stories</Link>
              )}
            </div>
            <h1>{storyId ? "Story pool" : "Your pool"}</h1>
          </div>
        </div>

        <p className="dim">
          Private to your account
          {storyId ? " and applied only inside this story." : ", applied across every story unless a story overrides it."}
        </p>

        <section className="section">
          <Collapsible title="Add a custom entry">
            <form onSubmit={handleAddCustom} className="stack">
              <div className="field-row">
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
                  Rarity
                  <input type="number" step="0.1" min="0" max="10" value={customRarity} onChange={(e) => setCustomRarity(e.target.value)} />
                </label>
              </div>
              <label>
                Name
                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} required />
              </label>
              <label>
                Description
                <textarea value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} rows={3} />
              </label>
              <div>
                <button type="submit" className="btn-primary" disabled={createCustomization.isPending}>
                  Add entry
                </button>
              </div>
            </form>
          </Collapsible>

          {customEntries.length > 0 && (
            <div className="stack">
              <h2>Your entries ({customEntries.length})</h2>
              {customEntries.map((c) => (
                <div key={c.id} className={`entry-row${c.isExcluded ? " entry-row--off" : ""}`} style={tierStyle(c.rarity ?? 0)}>
                  <div className="entry-row__head">
                    <span className="entry-row__name">
                      <CategoryGlyph category={c.category} size={18} className="glyph" />
                      {c.name}
                      <TierPill tier={tierName(c.rarity ?? 0)} rarity={c.rarity ?? 0} />
                    </span>
                    <span className="row">
                      <button type="button" className="btn-ghost btn-sm" onClick={() => updateCustomization.mutate({ id: c.id, input: { isExcluded: !c.isExcluded } })}>
                        {c.isExcluded ? "Enable" : "Disable"}
                      </button>
                      <button type="button" className="btn-danger btn-sm" onClick={() => deleteCustomization.mutate(c.id)}>
                        Delete
                      </button>
                    </span>
                  </div>
                  {c.description && <p className="entry-row__desc">{c.description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h2>Official entries</h2>

          <div className="filters">
            <div className="inline-form">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as ConcreteGachaCategory);
                  setLimit(50);
                }}
                style={{ maxWidth: "150px" }}
              >
                {CONCRETE_GACHA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setLimit(50);
                }}
              />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                style={{ maxWidth: "190px" }}
              >
                <option value="name-asc">Name A → Z</option>
                <option value="name-desc">Name Z → A</option>
                <option value="rarity-desc">Rarity: highest first</option>
                <option value="rarity-asc">Rarity: lowest first</option>
              </select>
            </div>

            <div className="tier-filter">
              {TIER_BANDS.map((band) => {
                const on = tiers.includes(band.name);
                return (
                  <label key={band.name} className={`tier-check${on ? " tier-check--on" : ""}`} style={tierStyle(band.color)}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {
                        setTiers((prev) => (on ? prev.filter((t) => t !== band.name) : [...prev, band.name]));
                        setLimit(50);
                      }}
                    />
                    {band.name}
                  </label>
                );
              })}
              {tiers.length > 0 && (
                <button type="button" className="btn-ghost btn-sm" onClick={() => setTiers([])}>
                  Clear
                </button>
              )}
            </div>

            {entryPage && (
              <span className="dim">
                Showing {entries?.length ?? 0} of {entryPage.total}
                {tiers.length > 0 ? ` in ${tiers.length} tier${tiers.length > 1 ? "s" : ""}` : ""}
              </span>
            )}
          </div>

          {isLoading && <p className="dim">Loading...</p>}

          <div className="stack">
            {entries?.map((entry) => {
              const override = byBaseId.get(entry.id);
              const name = override?.name ?? entry.name;
              const rarity = override?.rarity ?? entry.rarity;
              const description = override?.description ?? entry.description;

              return (
                <div
                  key={entry.id}
                  className={`entry-row${override?.isExcluded ? " entry-row--off" : ""}`}
                  style={tierStyle(rarity)}
                >
                  <div className="entry-row__head">
                    <span className="entry-row__name">
                      <CategoryGlyph category={entry.category} size={18} className="glyph" />
                      {name}
                      <TierPill tier={tierName(rarity)} rarity={rarity} />
                      {override && !override.isExcluded && <span className="badge">edited</span>}
                      {override?.isExcluded && <span className="badge">excluded</span>}
                    </span>
                    <span className="row">
                      <button type="button" className="btn-ghost btn-sm" onClick={() => toggleExclude(entry)}>
                        {override?.isExcluded ? "Include" : "Exclude"}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => setEditingEntryId(editingEntryId === entry.id ? null : entry.id)}
                      >
                        {editingEntryId === entry.id ? "Close" : "Edit"}
                      </button>
                      {override && (
                        <button type="button" className="btn-danger btn-sm" onClick={() => deleteCustomization.mutate(override.id)}>
                          Reset
                        </button>
                      )}
                    </span>
                  </div>

                  <p className="entry-row__desc">{description}</p>

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
                </div>
              );
            })}
          </div>

          {entryPage && entries && entries.length < entryPage.total && (
            <div>
              <button type="button" className="btn-ghost" onClick={() => setLimit((current) => current + 50)}>
                Load more ({entryPage.total - entries.length} left)
              </button>
            </div>
          )}

          {entryPage && entryPage.total === 0 && <p className="empty">No entries match these filters.</p>}
        </section>
      </main>
    </AppShell>
  );
}
