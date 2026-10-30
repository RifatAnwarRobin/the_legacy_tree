import { useEffect, useState } from "react";

import { fetchPersonDetail } from "../api/client";
import type { PersonDetail } from "../types";

interface Props {
  personId: string;
  onClose: () => void;
}

export function DetailPanel({ personId, onClose }: Props) {
  const [detail, setDetail] = useState<PersonDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setDetail(null);
    setError("");
    fetchPersonDetail(personId)
      .then((data) => active && setDetail(data))
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [personId]);

  return (
    <aside className="panel">
      <button className="panel-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      {error && <p className="panel-error">{error}</p>}
      {!detail && !error && <p className="panel-loading">Loading…</p>}

      {detail && (
        <div className="panel-body">
          <h2 className="panel-name">{detail.name}</h2>
          <p className="panel-meta">
            {detail.gender}
            {detail.birth.date ? ` · b. ${detail.birth.date}` : ""}
            {detail.birth.place ? ` · ${detail.birth.place}` : ""}
          </p>

          <PanelList title="Parents" items={detail.parents.map((p) => p.name)} />
          <PanelList title="Partners" items={detail.partners.map((p) => p.name)} />
          <PanelList title="Children" items={detail.children.map((p) => p.name)} />

          {detail.events.length > 0 && (
            <section className="panel-section">
              <h3 className="panel-heading">Life events</h3>
              <ul className="panel-events">
                {detail.events.map((event, index) => (
                  <li key={index}>
                    <span className="event-type">{event.type}</span>
                    {event.date ? <span className="event-date"> · {event.date}</span> : null}
                    {event.description ? (
                      <span className="event-desc"> — {event.description}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </aside>
  );
}

function PanelList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="panel-section">
      <h3 className="panel-heading">{title}</h3>
      <ul className="panel-list">
        {items.map((name, index) => (
          <li key={index}>{name}</li>
        ))}
      </ul>
    </section>
  );
}
