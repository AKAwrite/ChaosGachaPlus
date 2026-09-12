import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStory } from "../hooks/useStories";
import { useCharacters, useCreateCharacter, useDeleteCharacter } from "../hooks/useCharacters";

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
    <main>
      <header className="app-header">
        <div>
          <Link to="/stories">&larr; Your stories</Link>
          <h1>{story?.title ?? "..."}</h1>
        </div>
        <nav>
          <Link to={`/stories/${storyId}/history`}>History</Link>
          {" · "}
          <Link to={`/stories/${storyId}/entries`}>Entries</Link>
        </nav>
      </header>

      <h2>Characters</h2>
      <form onSubmit={handleCreate} className="inline-form">
        <input
          type="text"
          placeholder="New character name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit" disabled={createCharacter.isPending}>
          Create character
        </button>
      </form>

      {isLoading && <p>Loading...</p>}
      {characters && characters.length === 0 && <p>No characters yet. Create your first one above.</p>}

      <ul className="entity-list">
        {characters?.map((character) => (
          <li key={character.id}>
            <Link to={`/stories/${storyId}/characters/${character.id}`}>{character.name}</Link>
            <button
              type="button"
              className="danger"
              onClick={() => {
                if (confirm(`Delete "${character.name}" and their tickets/pulls?`)) {
                  deleteCharacter.mutate(character.id);
                }
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
