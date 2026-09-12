import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStory } from "../hooks/useStories";
import { useCharacters, useCreateCharacter, useDeleteCharacter } from "../hooks/useCharacters";
import { AppShell } from "../components/common/AppShell";

export function StoryDetailPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = useStory(storyId);
  const { data: characters, isLoading } = useCharacters(storyId);
  const createCharacter = useCreateCharacter(storyId!);
  const deleteCharacter = useDeleteCharacter(storyId!);
  const [name, setName] = useState("");

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await createCharacter.mutateAsync(name.trim());
    setName("");
  }

  return (
    <AppShell>
      <main className="page">
        <div className="page-head">
          <div>
            <div className="page-head__sub">
              <Link to="/stories">&larr; All stories</Link>
            </div>
            <h1>{story?.title ?? "..."}</h1>
          </div>
          <div className="row">
            <Link to={`/stories/${storyId}/entries`} className="dim">
              Entries
            </Link>
            <Link to={`/stories/${storyId}/history`} className="dim">
              Story log
            </Link>
          </div>
        </div>

        <form onSubmit={handleCreate} className="inline-form">
          <input type="text" placeholder="Add a character..." value={name} onChange={(e) => setName(e.target.value)} required />
          <button type="submit" className="btn-primary" disabled={createCharacter.isPending}>
            Create
          </button>
        </form>

        {isLoading && <p className="dim">Loading...</p>}
        {characters && characters.length === 0 && <p className="empty">No characters yet. Add your first one above.</p>}

        <div className="card-grid">
          {characters?.map((character) => (
            <div key={character.id} className="link-card">
              <Link to={`/stories/${storyId}/characters/${character.id}`} className="link-card__title">
                {character.name}
              </Link>
              <span className="link-card__meta">Joined {new Date(character.createdAt).toLocaleDateString()}</span>
              <div className="link-card__foot">
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => {
                    if (confirm(`Delete "${character.name}" and everything they've earned?`)) {
                      deleteCharacter.mutate(character.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
