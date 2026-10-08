import React from 'react';

/* ---------- Theme ---------- */

const ThemeCtx = React.createContext({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });
  const toggle = React.useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      root.classList.add('theming');
      root.dataset.theme = next;
      try { localStorage.setItem('cp-theme', next); } catch { /* private mode */ }
      window.setTimeout(() => root.classList.remove('theming'), 550);
      return next;
    });
  }, []);
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return React.useContext(ThemeCtx);
}

/** Sun ↔ moon morphing theme control. */
export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <svg className="icon-moon" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <svg className="icon-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* ---------- Brand mark: refined trajectory / orbit ---------- */

export function BrandMark({ size = 30 }) {
  return (
    <span className="brand__mark" aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M21.5 10.2A8.2 8.2 0 1 0 21.5 21.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="21.5" cy="10.2" r="2" fill="#C96B4B" />
        <ellipse cx="23.4" cy="7.6" rx="3.6" ry="3.2" stroke="#557A6E" strokeWidth="1.1" opacity="0.85" transform="rotate(-18 23.4 7.6)" />
      </svg>
    </span>
  );
}

/* ---------- Professional stroke icon set (Lucide-style, inline) ---------- */

const ICON_PATHS = {
  resume: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></>,
  skills: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5.5" /></>,
  match: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7L12.5 19.5" /></>,
  roadmap: <><circle cx="5" cy="19" r="2.2" /><circle cx="19" cy="5" r="2.2" /><path d="M7 19h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h10" opacity="0" /><path d="M7.2 19H14a4 4 0 0 0 0-8h-1M10 11h4a4 4 0 0 1 0 8h-1" strokeDasharray="0" /><path d="M7 19h7a4 4 0 0 0 0-8H9" /><path d="M15 6h4a4 4 0 0 1 0 8h-6" /></>,
  interview: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 20l1-5.3A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" /></>,
  analysis: <><path d="M3 3v18h18" /><path d="m7 15 4-6 3 3 5-8" /></>,
  security: <><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" /><path d="m9 11.5 2 2 4-4.5" /></>,
  progress: <><path d="M12 20a8 8 0 1 1 8-8" /><path d="M12 12l4-4" /><path d="M20 3v4h-4" /></>,
  career: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m17 8 2 2 4-4" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></>,
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
  check: <><path d="m4.5 12.5 5 5 10-11" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>
};

export function Icon({ name = 'analysis', size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" {...props}>
      {ICON_PATHS[name] || ICON_PATHS.analysis}
    </svg>
  );
}

/* ---------- Custom cursor: dot + trailing ring ---------- */

export function Cursor() {
  const dot = React.useRef(null);
  const ring = React.useRef(null);
  React.useEffect(() => {
    if (REDUCED) return;
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return;
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    function move(e) {
      x = e.clientX; y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      const hot = e.target && e.target.closest && e.target.closest('a, button, [role="button"], input, textarea, select');
      if (ring.current) ring.current.dataset.hot = hot ? 'true' : 'false';
    }
    function loop() {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <span ref={dot} className="cursor-dot" aria-hidden="true" />
      <span ref={ring} className="cursor-ring" aria-hidden="true" />
    </>
  );
}

/* ---------- Motion helpers ---------- */

const REDUCED = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

/** Magnetic pull toward the cursor — subtle, desktop pointers only. */
export function useMagnetic(strength = 0.22) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED) return;
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;
    let raf = 0;
    function onMove(e) {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${(x * strength).toFixed(1)}px, ${(y * strength).toFixed(1)}px)`;
      });
    }
    function onLeave() {
      cancelAnimationFrame(raf);
      el.style.transform = '';
    }
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [strength]);
  return ref;
}

/** Animated number — counts up once visible. */
export function CountUp({ value, duration = 1400 }) {
  const [n, setN] = React.useState(0);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const target = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    if (REDUCED) { setN(target); return; }
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      (function tick(t) {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 4);
        setN(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);
  return <span ref={ref}>{n}</span>;
}

/* ---------- Primitives ---------- */

export function Button({ variant = 'primary', size, to, href, ...props }) {
  const cls = `btn btn--${variant}${size === 'sm' ? ' btn--sm' : ''}`;
  if (to) return <a href={to} className={cls} {...props} />;
  if (href) return <a href={href} className={cls} {...props} />;
  return <button type="button" className={cls} {...props} />;
}

/** Primary call-to-action: magnetic, arrow that travels on hover. */
export function CTA({ to, href, children, variant = 'primary', magnetic = true, ...props }) {
  const ref = useMagnetic(0.18);
  const cls = `btn btn--${variant}`;
  const inner = <>{children} <span className="arr" aria-hidden="true">→</span></>;
  if (to) return <a href={to} ref={magnetic ? ref : undefined} className={cls} {...props}>{inner}</a>;
  return <a href={href} ref={magnetic ? ref : undefined} className={cls} {...props}>{inner}</a>;
}

export function Badge({ tone, children }) {
  return <span className={`badge${tone ? ` badge--${tone}` : ''}`}>{children}</span>;
}

export function Card({ hover, className = '', ...props }) {
  return <div className={`card${hover ? ' card--hover' : ''} ${className}`} {...props} />;
}

/** Editorial section heading: kicker + display title + lede. */
export function SectionHead({ kicker, title, lede, center }) {
  return (
    <Reveal>
      {kicker && <p className={`eyebrow${center ? ' eyebrow--center' : ''}`}>{kicker}</p>}
      <h2 className="section-title" style={center ? { textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' } : undefined}>{title}</h2>
      {lede && <p className="section-sub" style={center ? { textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' } : undefined}>{lede}</p>}
    </Reveal>
  );
}

/* ---------- Forms ---------- */

export function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>
        {label}
        {hint && <> <span className="hint">— {hint}</span></>}
      </label>
      {children}
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Textarea(props) {
  return <textarea className="textarea" {...props} />;
}

export function Select({ children, ...props }) {
  return <select className="select" {...props}>{children}</select>;
}

/* ---------- Target role selector ----------
   Searchable dropdown + free-form custom role.
   Controlled by a plain string — the parent owns the exact
   `targetRole` state, so validation and the API contract are unchanged. */

const ROLE_GROUPS = [
  { name: 'Development', roles: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer', 'Java Developer', 'Python Developer', 'React Developer', 'Node.js Developer', 'Mobile App Developer', 'Android Developer', 'iOS Developer'] },
  { name: 'Data & AI', roles: ['Data Analyst', 'Data Scientist', 'Data Engineer', 'Machine Learning Engineer', 'AI Engineer'] },
  { name: 'Cloud & DevOps', roles: ['Cloud Engineer', 'AWS Cloud Engineer', 'Azure Cloud Engineer', 'DevOps Engineer', 'Solutions Architect', 'System Administrator'] },
  { name: 'Security', roles: ['Cybersecurity Analyst', 'Cybersecurity Engineer'] },
  { name: 'Design & Product', roles: ['UI/UX Designer', 'Product Designer', 'Product Manager', 'Business Analyst'] },
  { name: 'Testing & Support', roles: ['QA Engineer', 'Automation Test Engineer', 'Technical Support Engineer', 'Database Administrator'] }
];

const ALL_ROLES = ROLE_GROUPS.flatMap((g) => g.roles);

function matchesRole(role, group, q) {
  return role.toLowerCase().includes(q) || group.toLowerCase().includes(q);
}

export function TargetRoleSelect({ id = 'role', value = '', onChange, ariaInvalid }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [custom, setCustom] = React.useState(() => Boolean(value) && !ALL_ROLES.includes(value));
  const [active, setActive] = React.useState(0);
  const wrap = React.useRef(null);
  const search = React.useRef(null);
  const listId = `${id}-listbox`;

  const q = query.trim().toLowerCase();
  const groups = React.useMemo(() => {
    if (!q) return ROLE_GROUPS;
    return ROLE_GROUPS
      .map((g) => ({ name: g.name, roles: g.roles.filter((r) => matchesRole(r, g.name, q)) }))
      .filter((g) => g.roles.length > 0);
  }, [q]);
  const flat = React.useMemo(() => groups.flatMap((g) => g.roles), [groups]);
  const count = flat.length + 1; // roles + "custom role" row

  React.useEffect(() => { setActive(0); }, [query, open]);

  // close on outside click
  React.useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open ]);

  // focus search on open
  React.useEffect(() => {
    if (open && search.current) search.current.focus();
  }, [open ]);

  // keep keyboard-highlighted option visible
  React.useEffect(() => {
    if (!open) return;
    const el = wrap.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open ]);

  function choose(role) {
    onChange(role);
    setOpen(false);
    setQuery('');
  }
  function goCustom() {
    setCustom(true);
    setOpen(false);
    setQuery('');
  }

  function onKey(e) {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!open) return;
    if (e.key === 'Tab') { setOpen(false); return; }
    // native Enter/Space on option buttons already clicks them — don't double-handle
    if ((e.key === 'Enter' || e.key === ' ') && e.target?.getAttribute?.('role') === 'option') return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % count); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + count) % count); }
    else if (e.key === 'Enter') {
      e.preventDefault(); // never submit the form from the search box
      if (active < flat.length) choose(flat[active]);
      else goCustom();
    }
  }

  if (custom) {
    return (
      <div>
        <Input
          id={id}
          value={value}
          aria-invalid={ariaInvalid}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Generative AI Engineer"
          autoComplete="off"
        />
        <button type="button" className="btn btn--quiet btn--sm" onClick={() => setCustom(false)} style={{ marginTop: 8, paddingLeft: 0 }}>
          ← Browse roles instead
        </button>
      </div>
    );
  }

  let seen = 0;
  return (
    <div className="troles" ref={wrap} onKeyDown={onKey}>
      <button
        type="button"
        id={`${id}-trigger`}
        className="troles__trigger"
        data-open={open}
        aria-invalid={ariaInvalid}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? '' : 'troles__placeholder'}>{value || 'Select your target role'}</span>
        <svg className="troles__chev" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="troles__pop">
          <div className="troles__search">
            <input
              ref={search}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles..."
              aria-label="Search roles"
              autoComplete="off"
            />
          </div>
          <div
            className="troles__list"
            role="listbox"
            id={listId}
            aria-label="Target roles"
            aria-activedescendant={active < flat.length ? `${id}-opt-${active}` : `${id}-opt-custom`}
          >
            {flat.length === 0 && (
              <p className="troles__empty">No roles match “{query.trim()}”. Enter it as a custom role below.</p>
            )}
            {groups.map((g) => (
              <React.Fragment key={g.name}>
                <p className="troles__group" aria-hidden="true">{g.name}</p>
                {g.roles.map((r) => {
                  const idx = seen++;
                  return (
                    <button
                      key={r}
                      type="button"
                      role="option"
                      id={`${id}-opt-${idx}`}
                      aria-selected={value === r}
                      data-active={active === idx}
                      className="troles__opt"
                      onClick={() => choose(r)}
                      onMouseEnter={() => setActive(idx)}
                    >
                      {r}
                      <span className="check" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m4.5 12.5 5 5 10-11" />
                        </svg>
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
            <button
              type="button"
              role="option"
              id={`${id}-opt-custom`}
              aria-selected={false}
              data-active={active === flat.length}
              className="troles__opt troles__custom"
              onClick={goCustom}
              onMouseEnter={() => setActive(flat.length)}
            >
              <span aria-hidden="true" style={{ color: 'var(--accent)', fontWeight: 700 }}>+</span> Enter a custom role
              <span className="check" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FileUpload({ id, accept = 'application/pdf,.pdf', file, onChange, maxMb = 5 }) {
  const ref = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  const [localError, setLocalError] = React.useState('');

  function handleFile(f) {
    setLocalError('');
    if (!f) { onChange(null); return; }
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '');
    if (!isPdf) { setLocalError('Only PDF files are supported. Please choose a .pdf resume.'); onChange(null); return; }
    if (f.size > maxMb * 1024 * 1024) { setLocalError(`File is too large. Maximum size is ${maxMb} MB.`); onChange(null); return; }
    onChange(f);
  }

  return (
    <div>
      <div
        className="upload"
        data-drag={drag}
        role="button"
        tabIndex={0}
        aria-label="Upload PDF resume"
        onClick={() => ref.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ref.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
      >
        <input
          ref={ref}
          id={id}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="upload__row">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4 1.5h6.5L14 5v11.5H4V1.5Z" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 1.5V5H14" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span className="upload__name">{file.name}</span>
            <span className="faint" style={{ fontSize: '0.8rem' }}>({Math.max(1, Math.round(file.size / 1024))} KB)</span>
            <button
              type="button"
              className="btn btn--quiet btn--sm"
              onClick={(e) => { e.stopPropagation(); onChange(null); if (ref.current) ref.current.value = ''; }}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <p><strong>Drop your resume here</strong> or click to browse</p>
            <p className="upload__meta">PDF only · max {maxMb} MB · parsed on the server, never stored</p>
          </>
        )}
      </div>
      {localError && <span className="field-error" role="alert" style={{ display: 'block', marginTop: 8 }}>{localError}</span>}
    </div>
  );
}

/* ---------- Data display (legacy primitives retired; report uses bespoke visuals) ---------- */

/* ---------- Career trajectory visual ----------
   Abstract direction, not machinery: an ascending path from
   "where you are" to "career ready", with slow orbital motion
   and subtle pointer parallax. Pure SVG + CSS. */
export function TrajectoryVisual() {
  const wrap = React.useRef(null);
  React.useEffect(() => {
    const el = wrap.current;
    if (!el || REDUCED) return;
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;
    let raf = 0;
    function onMove(e) {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', nx.toFixed(3));
        el.style.setProperty('--py', ny.toFixed(3));
      });
    }
    function onLeave() {
      cancelAnimationFrame(raf);
      el.style.setProperty('--px', 0);
      el.style.setProperty('--py', 0);
    }
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={wrap} className="traj" role="img" aria-label="Abstract visualization of a career trajectory rising from current profile to career ready">
      <svg viewBox="0 0 480 490" aria-hidden="true">
        <defs>
          <linearGradient id="trajGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#8ff5c2" />
            <stop offset="1" stopColor="#8b8cff" />
          </linearGradient>
        </defs>
        {[60, 140, 220, 300, 380].map((y) => (
          <line key={y} className="traj__tick" x1="20" y1={y} x2="460" y2={y} />
        ))}
        <path className="traj__path--ghost" d="M40 430 C 150 430, 170 330, 250 300 S 380 220, 440 120" />
        <g style={{ transform: 'translate(calc(var(--px, 0)*10px), calc(var(--py, 0)*10px))', transition: 'transform 600ms cubic-bezier(.22,1,.36,1)' }}>
          <path className="traj__path" d="M40 430 C 150 430, 170 330, 250 300 S 380 220, 440 120" />
        </g>
        <g style={{ transform: 'translate(calc(var(--px, 0)*-14px), calc(var(--py, 0)*-14px))', transition: 'transform 600ms cubic-bezier(.22,1,.36,1)' }}>
          <circle className="traj__halo traj__halo--mint" cx="40" cy="430" r="14" style={{ transformOrigin: '40px 430px' }} />
          <circle className="traj__node traj__node--now" cx="40" cy="430" r="6" />
          <circle className="traj__halo traj__halo--lav" cx="440" cy="120" r="14" style={{ transformOrigin: '440px 120px' }} />
          <circle className="traj__node traj__node--dest" cx="440" cy="120" r="6" />
          <circle className="traj__node" cx="250" cy="300" r="4.5" />
        </g>
        <text className="traj__label traj__label--mint" x="40" y="464">Where you are</text>
        <text className="traj__label traj__label--lav" x="440" y="96" textAnchor="end">Career ready</text>
        <text className="traj__label" x="250" y="328" textAnchor="middle">Momentum</text>
      </svg>
    </div>
  );
}

/* ---------- Reveal on scroll ---------- */

export function Reveal({ children, as: Tag = 'div', className = '', delay = 0, ...props }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { el.dataset.seen = 'true'; return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { el.dataset.seen = 'true'; io.disconnect(); } }),
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`rv ${className}`} style={{ '--d': `${delay}ms` }} {...props}>{children}</Tag>;
}

/** Line-by-line display reveal for important headings. */
export function Lines({ lines, as: Tag = 'span', className = '' }) {
  return (
    <Reveal as={Tag} className={className}>
      {lines.map((l, i) => (
        <span key={i} className="rl"><span style={{ '--d': `${i * 110}ms` }}>{l.node || l}</span></span>
      ))}
    </Reveal>
  );
}

/* ---------- SEO ---------- */

export function PageMeta({ title, description }) {
  React.useEffect(() => {
    document.title = title ? `${title} — CareerPilot AI` : 'CareerPilot AI — Turn your skills into a career roadmap';
    let tag = document.querySelector('meta[name="description"]');
    if (tag && description) tag.setAttribute('content', description);
  }, [title, description]);
  return null;
}

