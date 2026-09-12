import { Link } from "react-router-dom";
import { TIER_BANDS } from "@chaosgachaplus/shared";
import { useAuth } from "../auth/AuthContext";
import { CategoryGlyph } from "../components/common/CategoryGlyph";
import { tierStyle } from "../lib/tier";

const PROJECT_REPO = "https://github.com/AKAwrite/ChaosGachaPlus";
const ORIGINAL_REPO = "https://github.com/Bronzdeck/ChaosGacha";

const FEATURES = [
  {
    title: "Stories and characters",
    body: "Group your rolls where they belong: a story, the characters in it, and everything each one has won.",
  },
  {
    title: "Tickets earned by feats",
    body: "Record what earned a roll — killed the demon lord, survived the fall, was simply born — and mint several tickets from one feat.",
  },
  {
    title: "Reroll without consequence",
    body: "Nothing is written down until you confirm it. A result that would wreck your story can simply be rolled again, as if it never happened.",
  },
  {
    title: "Advantage and batch rolls",
    body: "Roll twice and keep the one you want, or spend five tickets at once instead of one at a time.",
  },
  {
    title: "A character sheet, not a log",
    body: "Abilities, skills, traits and familiars grouped by kind, items sitting in inventory slots, and anything spent marked as consumed without losing its history.",
  },
  {
    title: "Your own pool",
    body: "Exclude entries you don't want, rewrite the ones you do, add your own, and optionally stop rolls from ever repeating something you already hold.",
  },
];

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <header className="landing__top">
        <span className="topbar__brand">
          Chaos<span>Gacha</span>Plus
        </span>
        <span className="topbar__spacer" />
        <a href={PROJECT_REPO} target="_blank" rel="noreferrer" className="dim">
          GitHub
        </a>
      </header>

      <section className="hero">
        <p className="hero__eyebrow">An open-source expansion of Bronzdeck's Chaos Gacha</p>
        <h1 className="hero__title">
          Roll the chaos of the multiverse
          <br />
          into your story
        </h1>
        <p className="hero__body">
          A weighted random-rarity gacha for writers: 3,625 handwritten abilities, items, familiars, traits and
          skills, from a rat off the New York subway to powers that rewrite reality. Spin one up, hand it to a
          character, and find out what the story does with it.
        </p>

        <div className="cta-row">
          {user ? (
            <Link to="/stories" className="cta cta--primary">
              Open your stories
            </Link>
          ) : (
            <>
              <Link to="/register" className="cta cta--primary">
                Create an account
              </Link>
              <Link to="/login" className="cta">
                Log in
              </Link>
            </>
          )}
          <a href={PROJECT_REPO} target="_blank" rel="noreferrer" className="cta">
            View on GitHub
          </a>
        </div>

        <div className="tier-strip" aria-hidden="true">
          {TIER_BANDS.map((band) => (
            <span key={band.name} className="tier-strip__pill" style={tierStyle(band.color)}>
              {band.name}
            </span>
          ))}
        </div>
      </section>

      <section className="landing__section">
        <h2>What this adds</h2>
        <p className="landing__lede">
          The original Chaos Gacha is a Python desktop app you download and roll in. It does one thing well: it
          gives you a result. ChaosGachaPlus keeps that exact rolling logic — the same rarity weighting, the same
          tiers, the same entries — and builds the part that comes after it: somewhere for those results to live.
        </p>

        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>

        <div className="category-strip">
          {(["ability", "item", "familiar", "trait", "skill"] as const).map((category) => (
            <span key={category} className="category-strip__item">
              <CategoryGlyph category={category} size={22} />
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="landing__section">
        <h2>Credit</h2>
        <div className="panel stack">
          <p className="muted">
            Every entry in the pool — the abilities, items, familiars, traits and skills, their rarities and all
            of their descriptions — and the rarity-weighting algorithm behind the rolls were created by{" "}
            <strong>Bronzdeck</strong> for the original{" "}
            <a href={ORIGINAL_REPO} target="_blank" rel="noreferrer">
              Chaos Gacha
            </a>
            . This project is an unofficial, non-commercial expansion of that work, shared under the same GPL-3.0
            license. If you enjoy it, the original is the reason it exists — go support it.
          </p>
          <div className="row">
            <a href={ORIGINAL_REPO} target="_blank" rel="noreferrer" className="cta">
              Original Chaos Gacha
            </a>
            <a href={PROJECT_REPO} target="_blank" rel="noreferrer" className="cta">
              ChaosGachaPlus
            </a>
          </div>
        </div>
      </section>

      <footer className="landing__foot">
        <span className="dim">Free, open source, and not for sale. GPL-3.0.</span>
      </footer>
    </div>
  );
}
