import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useCreateStory, useDeleteStory, useStories } from "../hooks/useStories";
import { AppShell } from "../components/common/AppShell";

export function StoriesPage() {
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
    <AppShell>
      <main className="page">
        <div className="page-head">
          <div>
            <div className="page-head__sub">Your worlds</div>
            <h1>Stories</h1>
          </div>
        </div>

        <form onSubmit={handleCreate} className="inline-form">
          <input type="text" placeholder="Name a new story..." value={title} onChange={(e) => setTitle(e.target.value)} required />
          <button type="submit" className="btn-primary" disabled={createStory.isPending}>
            Create
          </button>
        </form>

        {isLoading && <p className="dim">Loading...</p>}
        {stories && stories.length === 0 && <p className="empty">No stories yet. Name your first one above.</p>}

        <div className="card-grid">
          {stories?.map((story) => (
            <div key={story.id} className="link-card">
              <Link to={`/stories/${story.id}`} className="link-card__title">
                {story.title}
              </Link>
              <span className="link-card__meta">Created {new Date(story.createdAt).toLocaleDateString()}</span>
              <div className="link-card__foot">
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => {
                    if (confirm(`Delete "${story.title}" and everything in it?`)) {
                      deleteStory.mutate(story.id);
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
