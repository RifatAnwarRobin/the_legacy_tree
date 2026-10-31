interface Props {
  onEnter: () => void;
  onLogout: () => void;
  userName?: string;
}

export function Landing({ onEnter, onLogout, userName }: Props) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="brand">The Legacy Tree</span>
        <div className="nav-actions">
          {userName && <span className="nav-user">{userName}</span>}
          <button className="btn btn-ghost" onClick={onEnter}>
            Open the tree
          </button>
          <button className="btn btn-link" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-text">
          <h1 className="hero-title">
            Keep your family&rsquo;s story in one place.
          </h1>
          <p className="hero-lead">
            The Legacy Tree gathers the people, dates, and moments that connect
            your family, and shows how they fit together across generations.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onEnter}>
              Open the tree
            </button>
            <a className="btn btn-link" href="#about">
              See what it does
            </a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <LineageMotif />
        </div>
      </section>

      <section id="about" className="about">
        <p className="about-statement">
          Families remember in scattered places &mdash; a photo box, an aunt&rsquo;s
          memory, a name half-forgotten. The Legacy Tree holds all of it together,
          so the connections stay clear long after the stories would otherwise fade.
        </p>
      </section>

      <section className="capabilities">
        <article className="capability">
          <h2 className="capability-title">Add anyone, with any detail</h2>
          <p>
            Record people, dates, and places, plus life events like education,
            marriage, or migration &mdash; without squeezing a life into a rigid form.
          </p>
        </article>
        <article className="capability">
          <h2 className="capability-title">See the whole lineage</h2>
          <p>
            An interactive tree lays out every generation and shows parents,
            partners, and children at a glance.
          </p>
        </article>
        <article className="capability">
          <h2 className="capability-title">Kept by the whole family</h2>
          <p>
            Everyone can help keep it accurate and growing, so the record stays
            alive instead of sitting in one person&rsquo;s drawer.
          </p>
        </article>
      </section>

      <section className="glimpse">
        <div className="glimpse-frame">
          <LineageMotif />
        </div>
        <div className="glimpse-text">
          <h2 className="glimpse-title">A glimpse of the tree</h2>
          <p>
            Generations laid out top to bottom, partnerships linked, and every
            person one click from their full story.
          </p>
          <button className="btn btn-primary" onClick={onEnter}>
            Open the tree
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="brand brand-small">The Legacy Tree</span>
        <span className="footer-note">A living record of the family.</span>
      </footer>
    </div>
  );
}

/** An abstract lineage graphic — nodes joined by gilt connectors. */
function LineageMotif() {
  return (
    <svg viewBox="0 0 320 260" className="motif" role="img" aria-label="Lineage">
      <g className="motif-lines">
        <path d="M160 46 V96 M90 150 V96 H230 V150 M90 150 V200 M160 150 V200 M230 150 V200" />
      </g>
      <g className="motif-union">
        <path d="M120 46 H200" />
      </g>
      {[
        { x: 120, y: 46 },
        { x: 200, y: 46 },
        { x: 90, y: 150 },
        { x: 160, y: 150 },
        { x: 230, y: 150 },
        { x: 90, y: 200 },
        { x: 160, y: 200 },
        { x: 230, y: 200 },
      ].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="11" className={`motif-node n-${i % 3}`} />
      ))}
    </svg>
  );
}
