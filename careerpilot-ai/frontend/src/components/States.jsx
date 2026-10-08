import React from 'react';

/* Premium analysis loading — renders the REAL request stage, never fake percentages. */

export const ANALYSIS_STAGES = [
  'Reading your profile',
  'Understanding the target role',
  'Mapping your skills',
  'Comparing job requirements',
  'Identifying priority gaps',
  'Building your roadmap'
];

export function LoadingState({ stages = ANALYSIS_STAGES, active = 0, note }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <h3><span className="pulse" aria-hidden="true">● </span>Analyzing with CareerPilot AI</h3>
      <p>{note || 'Connected to the live request. Stages reflect the actual analysis pipeline — no invented progress.'}</p>
      <ol className="stages">
        {stages.map((s, i) => (
          <li key={s} data-on={i === active} data-done={i < active}>
            <span className="stage-dot" aria-hidden="true" />
            {s}{i === active ? '…' : ''}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ErrorState({ title = 'Something needs attention', message, onRetry, retryLabel = 'Try again', actions }) {
  if (!message) return null;
  return (
    <div className="state state--error" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="state__actions">
        {onRetry && <button className="btn btn--ghost btn--sm" onClick={onRetry}>{retryLabel}</button>}
        {actions}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, actions }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      <p>{body}</p>
      {actions && <div className="state__actions">{actions}</div>}
    </div>
  );
}

export function InfoState({ tone = '', title, body, actions }) {
  return (
    <div className={`state${tone ? ` state--${tone}` : ''}`} role="status">
      <h3>{title}</h3>
      <p>{body}</p>
      {actions && <div className="state__actions">{actions}</div>}
    </div>
  );
}
