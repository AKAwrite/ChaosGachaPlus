import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { StoriesPage } from "./pages/StoriesPage";
import { StoryDetailPage } from "./pages/StoryDetailPage";
import { CharacterDetailPage } from "./pages/CharacterDetailPage";
import { StoryHistoryPage } from "./pages/StoryHistoryPage";
import { EntriesPage } from "./pages/EntriesPage";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/stories"
          element={
            <ProtectedRoute>
              <StoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories/:storyId"
          element={
            <ProtectedRoute>
              <StoryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories/:storyId/characters/:characterId"
          element={
            <ProtectedRoute>
              <CharacterDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories/:storyId/history"
          element={
            <ProtectedRoute>
              <StoryHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories/:storyId/entries"
          element={
            <ProtectedRoute>
              <EntriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entries"
          element={
            <ProtectedRoute>
              <EntriesPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
