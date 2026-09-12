import { Link, useParams } from "react-router-dom";
import { useStory } from "../hooks/useStories";
import { useStoryHistory } from "../hooks/useHistory";
import { HistoryTimeline } from "../components/history/HistoryTimeline";

export function StoryHistoryPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const { data: story } = useStory(storyId);
  const { data: events, isLoading } = useStoryHistory(storyId!);

  return (
    <main>
      <header className="app-header">
        <div>
          <Link to={`/stories/${storyId}`}>&larr; {story?.title ?? "Back to story"}</Link>
          <h1>Story history</h1>
        </div>
      </header>
      {isLoading && <p>Loading...</p>}
      {events && <HistoryTimeline events={events} showCharacter />}
    </main>
  );
}
