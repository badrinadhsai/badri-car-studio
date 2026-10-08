import React from 'react';
import { Link } from 'react-router-dom';

// Shared history UI: premium empty states, newest-first lists, user-owned rows.
export function HistorySection({ kicker, title, loading, error, items, empty, renderItem, action }) {
  return (
    <section className="hist" aria-label={title}>
      <div className="hist__head">
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>{kicker}</p>
          <h2 className="hist__title">{title}</h2>
        </div>
        {action}
      </div>
      {loading && <p className="muted" role="status">Loading your career history…</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="hist__empty">
          <p><strong>{empty.title}</strong></p>
          <p className="muted">{empty.body}</p>
          {empty.cta && (
            <p style={{ marginTop: 12 }}>
              <Link to={empty.ctaTo} className="btn btn--primary btn--sm">{empty.cta} →</Link>
            </p>
          )}
        </div>
      )}
      {!loading && !error && items.length > 0 && (
        <ol className="hist__list">
          {items.map((item) => (
            <li key={item.id} className="hist__item">
              {renderItem(item)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export function ScorePill({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const tone = v >= 75 ? 'high' : v >= 50 ? 'mid' : 'low';
  return (
    <span className="pill" data-tone={tone === 'high' ? 'sage' : tone === 'mid' ? 'cobalt' : 'gap'}>
      <i />{v}
    </span>
  );
}
