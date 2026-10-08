import React from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark, Cursor, ThemeToggle } from './ui';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/analyze', label: 'Analyze' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/prompt-engineering', label: 'Prompt Engineering' },
  { to: '/about', label: 'About' }
];

function ScrollProgress() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    let raf = 0;
    function update() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const p = max > 0 ? h.scrollTop / max : 0;
        if (ref.current) ref.current.style.transform = `scaleX(${p})`;
      });
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return <div className="progress-top" aria-hidden="true"><span ref={ref} /></div>;
}

function AuthControls() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  if (!user) {
    return (
      <>
        <Link to="/login" className="btn btn--ghost btn--sm nav__login">Log In</Link>
        <Link to="/register" className="btn btn--primary btn--sm">Get Started →</Link>
      </>
    );
  }

  const name = (profile?.full_name || user.email || 'U').trim();
  const initial = (name[0] || 'U').toUpperCase();
  const first = name.split(' ')[0];

  async function logout() {
    setOpen(false);
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <span className="nav__user" ref={wrap}>
      <button
        type="button"
        className="nav__avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="nav__avatar-initial" aria-hidden="true">{initial}</span>
        <span className="nav__hi">Hi, {first.length > 10 ? `${first.slice(0, 10)}…` : first}</span>
      </button>
      {open && (
        <span className="nav__menu" role="menu" aria-label="Account">
          <Link to="/dashboard" role="menuitem" onClick={() => setOpen(false)}>Dashboard</Link>
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)}>Profile</Link>
          <Link to="/settings" role="menuitem" onClick={() => setOpen(false)}>Settings</Link>
          <button type="button" role="menuitem" onClick={logout}>Log Out</button>
        </span>
      )}
    </span>
  );
}

function FloatingNav({ open, setOpen }) {
  const { pathname } = useLocation();
  const linksRef = React.useRef(null);
  const [indicator, setIndicator] = React.useState({ x: 0, w: 0, visible: false });
  const [ready, setReady] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [elevated, setElevated] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  // spring-traveling active indicator
  React.useLayoutEffect(() => {
    function place() {
      const root = linksRef.current;
      if (!root) return;
      const active = root.querySelector('a.active');
      if (!active) { setIndicator((s) => ({ ...s, visible: false })); return; }
      setIndicator({ x: active.offsetLeft, w: active.offsetWidth, visible: true });
    }
    place();
    window.addEventListener('resize', place);
    const t = setTimeout(place, 120);
    return () => { window.removeEventListener('resize', place); clearTimeout(t); };
  }, [pathname]);

  // transparent → elevated capsule + hide on scroll down
  React.useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setElevated(y > 40);
        setHidden(y > 260 && y > last && !open);
        last = y;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [open ]);

  return (
    <div className="nav-float" data-ready={ready} data-hidden={hidden && !open} data-elevated={elevated}>
      <div className="nav-pill">
        <Link to="/" className="brand" aria-label="CareerPilot AI home">
          <BrandMark size={30} />
          <span className="brand__word">CareerPilot AI</span>
        </Link>
        <nav className="nav__links" aria-label="Primary" ref={linksRef}>
          <span
            className="nav__indicator"
            aria-hidden="true"
            style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w, opacity: indicator.visible ? 1 : 0 }}
          />
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav__cta">
          <ThemeToggle />
          <span className="nav__auth"><AuthControls /></span>
          <button
            className="nav__burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="burger-lines" aria-hidden="true"><span /><span /></span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ open, setOpen }) {
  const items = [{ to: '/', label: 'Home' }, ...LINKS, { to: '/interview', label: 'Interview Coach' }];
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const firstLink = React.useRef(null);
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && firstLink.current) {
      const t = setTimeout(() => firstLink.current && firstLink.current.focus(), 350);
      return () => { clearTimeout(t); document.body.style.overflow = ''; };
    }
    return () => { document.body.style.overflow = ''; };
  }, [open ]);
  return (
    <nav className={`mnav${open ? ' open' : ''}`} aria-label="Mobile" aria-hidden={!open}>
      {items.map((l, i) => (
        <NavLink
          key={l.to}
          to={l.to}
          ref={i === 0 ? firstLink : undefined}
          style={{ '--d': `${120 + i * 55}ms` }}
          className={({ isActive }) => (isActive ? 'active' : '')}
          tabIndex={open ? 0 : -1}
        >
          <small>{String(i + 1).padStart(2, '0')}</small> {l.label}
        </NavLink>
      ))}
      <div className="mnav__row" style={{ '--d': `${120 + items.length * 55}ms` }}>
        <span className="mnav__theme"><ThemeToggle /> <span>Light / Dark</span></span>
        {!user ? (
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn--ghost btn--sm" tabIndex={open ? 0 : -1}>Log In</Link>
            <Link to="/register" className="btn btn--primary btn--sm" tabIndex={open ? 0 : -1}>Get Started →</Link>
          </span>
        ) : (
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/dashboard" className="btn btn--primary btn--sm" tabIndex={open ? 0 : -1}>
              Hi, {(profile?.full_name || user.email || 'there').split(' ')[0]} →
            </Link>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              tabIndex={open ? 0 : -1}
              onClick={async () => { await signOut(); setOpen(false); navigate('/', { replace: true }); }}
            >
              Log Out
            </button>
          </span>
        )}
      </div>
    </nav>
  );
}

export default function Layout({ children }) {
  const [open, setOpen] = React.useState(false);
  const { pathname } = useLocation();

  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Cursor />
      <ScrollProgress />
      <FloatingNav open={open} setOpen={setOpen} />
      <MobileMenu open={open} setOpen={setOpen} />

      <main>{children}</main>

      <footer className="footer">
        <div className="container">
          <p className="footer__hero">CareerPilot AI</p>
          <p className="muted">Career intelligence for the next generation of professionals.</p>
          <div className="footer__grid">
            <div className="footer__col">
              <h4>Product</h4>
              <nav className="footer__links" aria-label="Product">
                <Link to="/analyze">Analyze</Link>
                <Link to="/interview">Interview Coach</Link>
                <Link to="/resume">Resume Studio</Link>
                <Link to="/roadmap">Roadmap</Link>
              </nav>
            </div>
            <div className="footer__col">
              <h4>Learn</h4>
              <nav className="footer__links" aria-label="Learn">
                <Link to="/how-it-works">How It Works</Link>
                <Link to="/prompt-engineering">Prompt Engineering</Link>
                <Link to="/skills">Skill Gaps</Link>
                <Link to="/job-match">Job Matching</Link>
              </nav>
            </div>
            <div className="footer__col">
              <h4>Company</h4>
              <nav className="footer__links" aria-label="Company">
                <Link to="/about">About</Link>
                <Link to="/about">Privacy</Link>
                <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
              </nav>
            </div>
          </div>
          <p className="footer__fine">
            Career guidance only — not a hiring decision. Scores are readiness signals, never probabilities.
            CareerPilot AI never invents qualifications, and resumes are processed in memory without unnecessary retention.
          </p>
        </div>
      </footer>
    </>
  );
}
