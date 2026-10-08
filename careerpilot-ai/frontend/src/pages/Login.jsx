import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Field, Input } from '../components/ui';
import AuthShell, { AuthFooter, BackHome, PasswordInput } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Login() {
  const { signIn, user, loading: authLoading, configured } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/dashboard';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [formError, setFormError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && user) navigate(redirect, { replace: true });
  }, [user, authLoading, navigate, redirect]);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const errs = {};
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Please enter a valid email address.';
    if (!password) errs.password = 'Please enter your password.';
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length > 0) return;
    setBusy(true);
    const { error } = await signIn({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setFormError(error);
      return;
    }
    navigate(redirect, { replace: true });
  }

  return (
    <AuthShell
      kicker="Welcome back"
      title="Log in to CareerPilot."
      lede="Your analyses, resume improvements, and interview history are waiting."
      metaTitle="Log in"
      metaDescription="Log in to CareerPilot AI to access your personal career analysis and history."
    >
      {!configured && (
        <p className="field-error" role="alert" style={{ marginBottom: 16 }}>
          Authentication is not configured yet. Add your Supabase credentials (see SUPABASE_SETUP.md) and reload.
        </p>
      )}
      <form onSubmit={submit} noValidate>
        <Field label="Email" error={errors.email} htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Field>
        <Field label="Password" error={errors.password} htmlFor="login-password">
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
            autoComplete="current-password"
            ariaInvalid={Boolean(errors.password)}
            placeholder="Your password"
          />
        </Field>
        {formError && <p className="field-error" role="alert" style={{ marginBottom: 12 }}>{formError}</p>}
        <button type="submit" className="btn btn--primary auth-submit" disabled={busy || !configured}>
          {busy ? 'Logging in…' : 'Log In'}
          {!busy && <span className="arr" aria-hidden="true"> →</span>}
        </button>
      </form>
      <AuthFooter
        left={<Link to="/forgot-password">Forgot password?</Link>}
        right={<span>New here? <Link to={`/register${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>Create account</Link></span>}
      />
      <BackHome />
    </AuthShell>
  );
}
