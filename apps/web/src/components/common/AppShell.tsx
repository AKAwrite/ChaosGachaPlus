import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/stories" className="topbar__brand">
          Chaos<span>Gacha</span>Plus
        </Link>
        <span className="topbar__spacer" />
        <Link to="/entries" className="dim">
          Entries
        </Link>
        <span className="topbar__user">{user?.email}</span>
        <button type="button" className="btn-ghost btn-sm" onClick={() => logout()}>
          Log out
        </button>
      </header>
      {children}
    </div>
  );
}
