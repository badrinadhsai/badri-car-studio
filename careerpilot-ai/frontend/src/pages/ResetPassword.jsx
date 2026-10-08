import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field } from '../components/ui';
import AuthShell, { AuthFooter, BackHome, PasswordInput, StrengthMeter } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { updatePassword, configured } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (confirm !== password) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setBusy(true);
    const { error: err } = await updatePassword(password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setNotice('Your password has been updated. Redirecting you to log in…');
    setTimeout(() => navigate('/login', { replace: true }), 1600);
  }

  return (
    <AuthShell
      kicker="Account recovery"
      title="Choose a new password."
      lede="Make it strong and unique — at least 6 characters."
      metaTitle="Reset password"
      metaDescription="Choose a new CareerPilot AI password."
    >
      <form onSubmit={submit} noValidate>
        <Field label="New Password" htmlFor="rp-password">
          <PasswordInput
            id="rp-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            autoComplete="new-password"
            ariaInvalid={Boolean(error)}
            placeholder="New password"
          />
          <StrengthMeter password={password} />
        </Field>
        <Field label="Confirm New Password" htmlFor="rp-confirm">
          <PasswordInput
            id="rp-confirm"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(''); }}
            autoComplete="new-password"
            ariaInvalid={Boolean(error)}
            placeholder="Repeat new password"
          />
        </Field>
        {error && <p className="field-error" role="alert" style={{ marginBottom: 12 }}>{error}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <button type="submit" className="btn btn--primary auth-submit" disabled={busy || !configured}>
          {busy ? 'Updating…' : 'Update Password'}
        </button>
      </form>
      <AuthFooter left={<Link to="/login">Back to log in</Link>} right={<span />} />
      <BackHome />
    </AuthShell>
  );
}
