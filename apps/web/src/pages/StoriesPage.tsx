import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCreateStory, useDeleteStory, useStories } from "../hooks/useStories";

export function StoriesPage() {
  const { user, logout } = useAuth();
  const { data: stories, isLoading } = useStories();
  const createStory = useCreateStory();
  const deleteStory = useDeleteStory();
  const [title, setTitle] = useState("");

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await createStory.mutateAsync(title.trim());
    setTitle("");
  }

  return (
    <main>
      <header className="app-header">
        <h1>Your stories</h1>
        <div>
          <span>{user?.email}</span>
          <button type="button" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>

      <form onSubmit={handleCreate} className="inline-form">
        <input
          type="text"
          placeholder="New story title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button type="submit" disabled={createStory.isPending}>
          Create story
        </button>
      </form>

      {isLoading && <p>Loading...</p>}
      {stories && stories.length === 0 && <p>No stories yet. Create your first one above.</p>}

      <ul className="entity-list">
        {stories?.map((story) => (
          <li key={story.id}>
            <Link to={`/stories/${story.id}`}>{story.title}</Link>
            <button
              type="button"
              className="danger"
              onClick={() => {
                if (confirm(`Delete "${story.title}" and everything in it?`)) {
                  deleteStory.mutate(story.id);
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
