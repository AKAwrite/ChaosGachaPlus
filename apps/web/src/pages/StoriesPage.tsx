import { useAuth } from "../auth/AuthContext";

export function StoriesPage() {
  const { user, logout } = useAuth();

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
      <p>Story and character management is coming in the next milestone.</p>
    </main>
  );
}
