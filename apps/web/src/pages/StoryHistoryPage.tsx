import { Link, useParams } from "react-router-dom";
import { useStory } from "../hooks/useStories";
import { useStoryHistory } from "../hooks/useHistory";
import { AppShell } from "../components/common/AppShell";
import { HistoryTimeline } from "../components/history/HistoryTimeline";

export function StoryHistoryPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = useStory(storyId);
  const { data: events, isLoading } = useStoryHistory(storyId!);

  return (
    <AppShell>
      <main className="page">
        <div className="page-head">
          <div>
            <div className="page-head__sub">
              <Link to={`/stories/${storyId}`}>&larr; {story?.title ?? "Back to story"}</Link>
            </div>
            <h1>Story log</h1>
          </div>
        </div>
        <div className="panel">
          {isLoading ? <p className="dim">Loading...</p> : <HistoryTimeline events={events ?? []} showCharacter />}
        </div>
      </main>
    </AppShell>
  );
}
