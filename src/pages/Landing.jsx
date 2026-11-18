import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const codeLines = [
  <>
    <span className="kw">import</span> os
  </>,
  <>
    <span className="kw">def</span> <span className="fn">login</span>(user, pw):
  </>,
  <>
    {'  '}
    <span className="kw">if</span> user.password == pw:
  </>,
  <>
    {'    '}
    <span className="kw">return</span> <span className="kw">True</span>
  </>,
];

const issues = [
  {
    id: 'crit',
    sev: 'crit',
    tag: 'Critical',
    label: 'Plain-text password compare',
    lines: [3],
    title: 'Critical · line 3',
    body: 'Passwords are compared as plain text, so they must be stored unhashed.',
    fix: 'verify_password(pw, user.password_hash)',
  },
  {
    id: 'major',
    sev: 'major',
    tag: 'Major',
    label: 'No error handling',
    lines: [2, 3, 4],
    title: 'Major · lines 2–4',
    body: 'A missing user or a database error would crash the login.',
    fix: 'try / except around the lookup, return False on failure',
  },
  {
    id: 'minor',
    sev: 'minor',
    tag: 'Minor',
    label: 'Unused import',
    lines: [1],
    title: 'Minor · line 1',
    body: 'os is imported but never used.',
    fix: 'Remove the import',
  },
];

const bugRows = [
  { sev: 'crit', tag: 'Critical', text: 'SQL built from user input', where: 'orders.py:48' },
  { sev: 'crit', tag: 'Critical', text: 'API key committed in config', where: 'settings.py:12' },
  { sev: 'major', tag: 'Major', text: 'Request has no timeout', where: 'client.py:77' },
  { sev: 'minor', tag: 'Minor', text: 'Variable shadows built-in', where: 'utils.py:9' },
];

const beforeCode = `def apply_discount(cart, code):
    rate = RATES.get(code, 0)
    return cart.total * (1 - rate)`;

const afterCode = `def apply_discount(cart, code):
    """Return the cart total after
    applying a discount code.

    Args:
        cart: Cart with a .total
        code: Promo code string
    Returns:
        float: discounted total.
        Unknown codes give 0% off.
    """`;

const weeks = [
  { c: 14, m: 26, n: 30 },
  { c: 12, m: 24, n: 28 },
  { c: 10, m: 20, n: 26 },
  { c: 7, m: 17, n: 22 },
  { c: 5, m: 14, n: 20 },
  { c: 3, m: 11, n: 17 },
];

const steps = [
  { title: 'Add your code', desc: 'Paste a snippet, upload files, or connect a GitHub repository.' },
  { title: 'Read the review', desc: 'Get issues sorted by severity, each with the line and a suggested fix.' },
  { title: 'Keep the docs', desc: 'Export docstrings and a README, and follow the map to learn the rest.' },
];

const compareRows = [
  ['Severity-tagged issues', 'Yes', 'Rule-based only', 'Inconsistent'],
  ['Explains the fix', 'Yes', 'Rarely', 'Yes'],
  ['Generates documentation', 'Yes', 'No', 'One file at a time'],
  ['Maps a whole repository', 'Yes', 'No', 'No'],
  ['Team dashboards', 'Yes', 'Needs extra tools', 'No'],
];

const mapNodes = [
  { x: 190, y: 22, label: 'main.py', sub: 'entry point', start: true },
  { x: 40, y: 128, label: 'auth_service.py', sub: 'login and sessions' },
  { x: 190, y: 128, label: 'routes.py', sub: 'HTTP endpoints' },
  { x: 340, y: 128, label: 'jobs.py', sub: 'background tasks' },
  { x: 40, y: 232, label: 'crypto.py', sub: 'hashing helpers' },
  { x: 190, y: 232, label: 'db.py', sub: 'queries and models' },
];

const mapBadges = [
  { cx: 190, cy: 22, n: 1 },
  { cx: 40, cy: 128, n: 2 },
  { cx: 190, cy: 128, n: 3 },
  { cx: 40, cy: 232, n: 4 },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState('crit');
  const active = issues.find((i) => i.id === activeId);

  const goTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startFree = () => navigate('/login?mode=signup');
  const signIn = () => navigate('/login');

  return (
    <div className="tufy-landing" id="top">
      <header>
        <div className="wrap">
          <div className="nav">
            <a className="logo" href="#top" onClick={goTo('top')} aria-label="Tufy home">
              <i>T</i>Tufy
            </a>
            <nav className="links" aria-label="Main">
              <a href="#features" onClick={goTo('features')}>Features</a>
              <a href="#how" onClick={goTo('how')}>How it works</a>
              <a href="#compare" onClick={goTo('compare')}>Compare</a>
            </nav>
            <button className="btn primary sm" onClick={startFree}>Get started</button>
          </div>
        </div>
      </header>

      <main className="wrap">
        <div className="hero">
          <div>
            <span className="pill">AI code review and documentation</span>
            <h1>
              Understand any codebase. <u>Review it.</u> Document it.
            </h1>
            <p className="lede">
              Paste code, get severity-tagged issues, auto-generated docs, and a guided reading map for unfamiliar repos.
            </p>
            <div className="cta">
              <button className="btn primary" onClick={startFree}>Start for free</button>
              <button className="btn ghost" onClick={signIn}>Sign in</button>
            </div>
          </div>

          <div className="card" aria-label="Example review">
            <div className="file">
              <span><i className="ico"></i>auth_service.py</span>
              <small>3 issues</small>
            </div>
            <div className="code">
              {codeLines.map((line, idx) => {
                const n = idx + 1;
                const on = active.lines.includes(n);
                return (
                  <span key={n} className={`ln${on ? ` on ${active.sev}` : ''}`}>
                    {line}
                  </span>
                );
              })}
            </div>
            <div className="issues">
              {issues.map((i) => (
                <button
                  key={i.id}
                  className="issue"
                  aria-pressed={activeId === i.id}
                  onClick={() => setActiveId(i.id)}
                >
                  <span className={`tag ${i.sev}`}>{i.tag}</span>
                  {i.label}
                </button>
              ))}
            </div>
            <div className="fix" aria-live="polite">
              <b>{active.title}</b>
              <br />
              {active.body}
              <br />
              Fix: <code>{active.fix}</code>
            </div>
          </div>
        </div>

        <div className="chips">
          <a href="#bugs" onClick={goTo('bugs')}>Bug and security detection</a>
          <a href="#docs" onClick={goTo('docs')}>Auto documentation</a>
          <a href="#map" onClick={goTo('map')}>Codebase map</a>
          <a href="#teams" onClick={goTo('teams')}>Team dashboards</a>
        </div>

        <section id="features">
          <div className="sec-head">
            <h2>Everything you need to get through unfamiliar code</h2>
            <p>Tufy reads the code, tells you what's wrong, writes down what it does, and shows you where to start.</p>
          </div>

          <div className="feature" id="bugs">
            <div className="copy">
              <h3>Bug and security detection</h3>
              <p>Every finding is tagged Critical, Major or Minor and points at the exact line, so you fix the risky things first.</p>
              <ul>
                <li>Catches leaked secrets, injection risks and weak password handling</li>
                <li>Suggests a fix next to every issue</li>
                <li>Flags missing error handling and dead code</li>
              </ul>
            </div>
            <div className="viz">
              <div className="sumrow">
                <span className="tag crit">2 Critical</span>
                <span className="tag major">5 Major</span>
                <span className="tag minor">9 Minor</span>
              </div>
              {bugRows.map((r) => (
                <div className="row" key={r.where}>
                  <span className={`tag ${r.sev}`}>{r.tag}</span>
                  {r.text}
                  <span className="where">{r.where}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="feature flip" id="docs">
            <div className="copy">
              <h3>Auto documentation</h3>
              <p>Turn functions and modules into docstrings and README sections that match what the code actually does.</p>
              <ul>
                <li>Docstrings with parameters, return values and raised errors</li>
                <li>Module and README summaries in plain language</li>
                <li>Re-run after a change to keep docs current</li>
              </ul>
            </div>
            <div className="viz docs">
              <div>
                <div className="lbl">Before</div>
                {beforeCode}
              </div>
              <div className="out">
                <div className="lbl">Generated by Tufy</div>
                <b>{afterCode}</b>
              </div>
            </div>
          </div>

          <div className="feature" id="map">
            <div className="copy">
              <h3>Codebase map</h3>
              <p>Open a repo you've never seen and get a reading order: entry points first, then the files they depend on.</p>
              <ul>
                <li>Shows how modules call each other</li>
                <li>Marks where to start and what to read next</li>
                <li>One-line summary for every file</li>
              </ul>
            </div>
            <div className="viz map">
              <svg
                viewBox="0 0 520 300"
                role="img"
                aria-label="Reading map showing main.py leading to auth, api and db modules"
              >
                <path className="edge path" d="M260 62 L110 128" />
                <path className="edge path" d="M260 62 L260 128" />
                <path className="edge" d="M260 62 L410 128" />
                <path className="edge path" d="M110 168 L110 232" />
                <path className="edge" d="M260 168 L260 232" />
                <path className="edge" d="M410 168 L260 232" />
                {mapNodes.map((nd) => (
                  <g key={nd.label}>
                    <rect
                      className={`node${nd.start ? ' start' : ''}`}
                      x={nd.x}
                      y={nd.y}
                      width="140"
                      height="44"
                      rx="12"
                    />
                    <text x={nd.x + 70} y={nd.y + 20} textAnchor="middle">{nd.label}</text>
                    <text className="sub" x={nd.x + 70} y={nd.y + 35} textAnchor="middle">{nd.sub}</text>
                  </g>
                ))}
                {mapBadges.map((b) => (
                  <g key={b.n}>
                    <circle className="badge" cx={b.cx} cy={b.cy} r="11" />
                    <text className="badge-t" x={b.cx} y={b.cy + 4}>{b.n}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="feature flip" id="teams">
            <div className="copy">
              <h3>Team dashboards</h3>
              <p>See whether code quality is improving, which repos need attention, and how fast issues get closed.</p>
              <ul>
                <li>Open issues by severity, week over week</li>
                <li>Per-repo and per-team breakdowns</li>
                <li>Share a read-only view with managers</li>
              </ul>
            </div>
            <div className="viz">
              <div className="stats">
                <div className="stat"><b>42</b><span>Open issues</span></div>
                <div className="stat"><b>-31%</b><span>Since last month</span></div>
                <div className="stat"><b>1.8d</b><span>Avg. time to fix</span></div>
              </div>
              <div className="bars" aria-label="Open issues by week, trending down">
                {weeks.map((w, idx) => (
                  <div key={idx}>
                    <i className="c" style={{ height: `${w.c}%` }}></i>
                    <i className="m" style={{ height: `${w.m}%` }}></i>
                    <i className="n" style={{ height: `${w.n}%` }}></i>
                  </div>
                ))}
              </div>
              <div className="axis">
                {weeks.map((_, idx) => (
                  <span key={idx}>Wk {idx + 1}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how">
          <div className="sec-head">
            <h2>From paste to answers in three steps</h2>
            <p>No setup to try it. Connect a repository when you want it on every pull request.</p>
          </div>
          <div className="steps">
            {steps.map((s, idx) => (
              <div className="step" key={s.title}>
                <div className="n">{idx + 1}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="compare">
          <div className="sec-head">
            <h2>How Tufy compares</h2>
            <p>Linters are fast but narrow. Chat assistants are flexible but start from scratch every time.</p>
          </div>
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th className="us">Tufy</th>
                  <th>Linters</th>
                  <th>General AI chat</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map(([feature, us, linter, chat]) => (
                  <tr key={feature}>
                    <td>{feature}</td>
                    <td className="us yes">{us}</td>
                    <td className={linter === 'Yes' ? 'yes' : 'no'}>{linter}</td>
                    <td className={chat === 'Yes' ? 'yes' : 'no'}>{chat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="final">
          <h2>Review your first file in under a minute</h2>
          <p>Free to start. No credit card.</p>
          <div className="cta">
            <button className="btn primary" onClick={startFree}>Start for free</button>
            <button className="btn ghost" onClick={signIn}>Sign in</button>
          </div>
        </div>
      </main>

      <footer>
        <div className="wrap">
          <span>© 2026 Tufy</span>
          <nav aria-label="Footer">
            <a href="#features" onClick={goTo('features')}>Features</a>
            <a href="#how" onClick={goTo('how')}>How it works</a>
            <a href="#compare" onClick={goTo('compare')}>Compare</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
