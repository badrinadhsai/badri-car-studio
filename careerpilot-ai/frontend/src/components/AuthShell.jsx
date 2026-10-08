import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark, PageMeta, Reveal } from './ui';

// Shared premium shell for auth pages: same editorial language as the product.
export default function AuthShell({ kicker, title, lede, metaTitle, metaDescription, noindex = true, children, aside }) {
  return (
    <>
      <PageMeta title={metaTitle || title} description={metaDescription || lede} />
      {noindex && <NoIndex />}
      <div className="container auth-wrap">
        <div className="auth-grid">
          <Reveal className="auth-main">
            <p className="eyebrow">{kicker}</p>
            <h1 className="page-title auth-title">{title}</h1>
            {lede && <p className="lede">{lede}</p>}
            <div className="card auth-card">{children}</div>
          </Reveal>
          <aside className="auth-aside" aria-label="Why CareerPilot">
            <div className="auth-aside__inner">
              <span aria-hidden="true"><BrandMark size={40} /></span>
              {aside || (
                <>
                  <h2>Your career, with memory.</h2>
                  <p>
                    Log in to run AI analysis, keep every readiness score, revisit resume
                    improvements, and track mock interviews — all private to your account.
                  </p>
                  <ul>
                    <li><strong>Private by default</strong> — your data, protected by row-level security.</li>
                    <li><strong>Continuous</strong> — each analysis builds on your history.</li>
                    <li><strong>Honest signals</strong> — readiness scores, never hiring verdicts.</li>
                  </ul>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function NoIndex() {
  React.useEffect(() => {
    let tag = document.querySelector('meta[name="robots"]');
    const created = !tag;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'robots');
      document.head.appendChild(tag);
    }
    const prev = tag.getAttribute('content');
    tag.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (created) tag.remove();
      else if (prev) tag.setAttribute('content', prev);
    };
  }, []);
  return null;
}

export function AuthFooter({ left, right }) {
  return (
    <div className="auth-foot">
      <span>{left}</span>
      {right}
    </div>
  );
}

export function PasswordInput({ id, value, onChange, autoComplete, ariaInvalid, ariaDescribedBy, placeholder }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="auth-pass">
      <input
        id={id}
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        placeholder={placeholder}
        minLength={6}
        required
      />
      <button
        type="button"
        className="btn btn--quiet btn--sm"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </span>
  );
}

export function StrengthMeter({ password }) {
  const score = React.useMemo(() => {
    let s = 0;
    if (password.length >= 6) s += 1;
    if (password.length >= 10) s += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s += 1;
    if (/\d/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    return Math.min(s, 4);
  }, [password]);
  const labels = ['Too weak', 'Weak', 'Okay', 'Strong', 'Excellent'];
  const label = password ? labels[score] : '';
  return (
    <div className="auth-strength" aria-live="polite">
      <span className="auth-strength__track" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} data-on={password.length > 0 && i < score} />
        ))}
      </span>
      {label && <span className="faint" style={{ fontSize: '0.82rem' }}>{label}</span>}
    </div>
  );
}

export function BackHome() {
  return (
    <p style={{ marginTop: 18 }}>
      <Link to="/" className="btn btn--quiet btn--sm">← Back to home</Link>
    </p>
  );
}
