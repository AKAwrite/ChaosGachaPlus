import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { user, login, loginError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/stories" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate("/stories");
    } catch {
      // loginError already carries the message.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">
          Chaos<span>Gacha</span>Plus
        </Link>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {loginError && <p role="alert">{loginError}</p>}
          <button type="submit" className="btn-primary btn-lg" disabled={isSubmitting}>
            {isSubmitting ? "Entering..." : "Enter"}
          </button>
        </form>
        <p className="auth-card__foot">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
