import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Field, Input } from '../components/ui';
import AuthShell, { AuthFooter, BackHome, PasswordInput, StrengthMeter } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Register() {
  const { signUp, user, loading: authLoading, configured } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/dashboard';

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [formError, setFormError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && user) navigate(redirect, { replace: true });
  }, [user, authLoading, navigate, redirect]);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const errs = {};
    if (fullName.trim().length < 2) errs.fullName = 'Please enter your full name.';
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Please enter a valid email address.';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (confirm !== password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    setFormError('');
    setNotice('');
    if (Object.keys(errs).length > 0) return;
    setBusy(true);
    const { error, needsConfirmation } = await signUp({
      fullName: fullName.trim(),
      email: email.trim(),
      password
    });
    setBusy(false);
    if (error) {
      setFormError(error);
      return;
    }
    if (needsConfirmation) {
      setNotice('Account created. Please check your email to verify your account, then log in.');
      return;
    }
    navigate(redirect, { replace: true });
  }

  return (
    <AuthShell
      kicker="Get started"
      title="Create your CareerPilot account."
      lede="One account. Your analyses, resume studio, and interview coach — remembered."
      metaTitle="Create account"
      metaDescription="Create your CareerPilot AI account to save analyses and track interviews."
    >
      {!configured && (
        <p className="field-error" role="alert" style={{ marginBottom: 16 }}>
          Authentication is not configured yet. Add your Supabase credentials (see SUPABASE_SETUP.md) and reload.
        </p>
      )}
      <form onSubmit={submit} noValidate>
        <Field label="Full Name" error={errors.fullName} htmlFor="reg-name">
          <Input
            id="reg-name"
            type="text"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: '' })); }}
            aria-invalid={Boolean(errors.fullName)}
            autoComplete="name"
            placeholder="Alex Carter"
            required
          />
        </Field>
        <Field label="Email" error={errors.email} htmlFor="reg-email">
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Field>
        <Field label="Password" hint="minimum 6 characters" error={errors.password} htmlFor="reg-password">
          <PasswordInput
            id="reg-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
            autoComplete="new-password"
            ariaInvalid={Boolean(errors.password)}
            placeholder="Choose a password"
          />
          <StrengthMeter password={password} />
        </Field>
        <Field label="Confirm Password" error={errors.confirm} htmlFor="reg-confirm">
          <PasswordInput
            id="reg-confirm"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: '' })); }}
            autoComplete="new-password"
            ariaInvalid={Boolean(errors.confirm)}
            placeholder="Repeat your password"
          />
        </Field>
        {formError && <p className="field-error" role="alert" style={{ marginBottom: 12 }}>{formError}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <button type="submit" className="btn btn--primary auth-submit" disabled={busy || !configured}>
          {busy ? 'Creating your account…' : 'Create Account'}
          {!busy && <span className="arr" aria-hidden="true"> →</span>}
        </button>
      </form>
      <AuthFooter
        left={<span />}
        right={<span>Have an account? <Link to={`/login${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>Log in</Link></span>}
      />
      <BackHome />
    </AuthShell>
  );
}
