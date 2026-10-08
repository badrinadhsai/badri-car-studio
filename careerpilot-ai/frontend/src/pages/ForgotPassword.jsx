import React from 'react';
import { Link } from 'react-router-dom';
import { Field, Input } from '../components/ui';
import AuthShell, { AuthFooter, BackHome } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPassword() {
  const { resetPassword, configured } = useAuth();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setNotice('');
    setBusy(true);
    const { error: err } = await resetPassword(email.trim());
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setNotice('If an account exists for that email, a password reset link is on its way. Check your inbox.');
  }

  return (
    <AuthShell
      kicker="Account recovery"
      title="Reset your password."
      lede="Enter your account email and we'll send you a secure reset link."
      metaTitle="Forgot password"
      metaDescription="Reset your CareerPilot AI password."
    >
      <form onSubmit={submit} noValidate>
        <Field label="Email" error={error} htmlFor="fp-email">
          <Input
            id="fp-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            aria-invalid={Boolean(error)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Field>
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <button type="submit" className="btn btn--primary auth-submit" disabled={busy || !configured}>
          {busy ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
      <AuthFooter
        left={<Link to="/login">Back to log in</Link>}
        right={<span>New here? <Link to="/register">Create account</Link></span>}
      />
      <BackHome />
    </AuthShell>
  );
}
