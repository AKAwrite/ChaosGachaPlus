import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function RegisterPage() {
  const { user, register, registerError } = useAuth();
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
      await register({ email, password });
      navigate("/stories");
    } catch {
      // registerError already carries the message.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-card__brand">
          Chaos<span>Gacha</span>Plus
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </label>
          {registerError && <p role="alert">{registerError}</p>}
          <button type="submit" className="btn-primary btn-lg" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="auth-card__foot">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
