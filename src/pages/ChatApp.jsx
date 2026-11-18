import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./ChatApp.css";

const KNOWN_LANGUAGE = "Python";
const ACCEPT = ".py,.js,.jsx,.ts,.tsx,.java,.c,.cpp,.cs,.go,.rb,.php,.txt";
const SEVERITIES = ["critical", "major", "minor"];


const LANG_BY_EXT = {
  py: "python", js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  java: "java", c: "c", cpp: "cpp", cs: "csharp", go: "go", rb: "ruby", php: "php",
};
const guessLanguage = (name = "") =>
  LANG_BY_EXT[name.split(".").pop().toLowerCase()] || "python";

// Pasted code gets an auto name (snippet_...), not worth showing in the chat.
const showName = (n) => (n && !n.startsWith("snippet_") ? n : undefined);

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, content: String(reader.result) });
    reader.onerror = reject;
    reader.readAsText(file);
  });

const normalizeSeverity = (s) => {
  const v = String(s ?? "minor").toLowerCase();
  return SEVERITIES.includes(v) ? v : "minor";
};

// Django ReviewResult rows -> the card shape used by this page
const mapReviewResults = (results = []) =>
  results.map((r) => ({
    severity: normalizeSeverity(r.severity),
    line: r.line_number ?? r.line ?? null,
    title: r.description ?? r.title ?? "Issue found",
    hint: r.suggestion ?? r.hint,
    filename: showName(r.filename),
  }));

/* ---------- icons ---------- */
const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" className="t-icon">{children}</svg>
);
const PlusIcon = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
const TeamIcon = () => (
  <Icon>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.3c2 .7 3.5 2.5 3.5 5.7" />
  </Icon>
);
const ProfileIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Icon>
);
const ClipIcon = () => (
  <Icon>
    <path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.9-8.9a3.3 3.3 0 0 1 4.7 4.7l-8.9 8.9a1.7 1.7 0 0 1-2.4-2.4l8.2-8.2" />
  </Icon>
);
const XIcon = () => <Icon><path d="M18 6L6 18M6 6l12 12" /></Icon>;


function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.length > 4 && p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.length > 2 && p.startsWith("`") && p.endsWith("`")) {
      return <code key={i} className="t-code">{p.slice(1, -1)}</code>;
    }
    return <span key={i}>{p}</span>;
  });
}

function RichText({ text }) {
  const parts = String(text ?? "").split(/```[\w-]*\n?([\s\S]*?)```/g);
  return (
    <div className="t-rich">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="t-pre">{p.replace(/\n$/, "")}</pre>
        ) : p.trim() ? (
          <p key={i}><Inline text={p.trim()} /></p>
        ) : null
      )}
    </div>
  );
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      setDone(false);
    }
  };
  return <button className="t-copy" onClick={copy}>{done ? "Copied" : "Copy"}</button>;
}

function FileChips({ items, accent }) {
  if (!items || items.length === 0) return <span className="t-muted">None</span>;
  return (
    <div className="t-fchips">
      {items.map((f) => (
        <span key={f} className={`t-fchip${accent ? " accent" : ""}`}>{f}</span>
      ))}
    </div>
  );
}

/* ---------- review card ---------- */
function IssueCard({ issue, onAsk }) {
  return (
    <article className="t-card">
      <div className="t-card-head">
        <span className={`t-tag ${issue.severity}`}>
          {issue.severity[0].toUpperCase() + issue.severity.slice(1)}
        </span>
        <span className="t-line">
          {issue.filename ? `${issue.filename} · ` : ""}
          {issue.line ? `line ${issue.line}` : "general"}
        </span>
      </div>
      <div className="t-card-title">{issue.title}</div>
      {issue.hint && <div className="t-card-hint">{issue.hint}</div>}
      <button className="t-link" onClick={() => onAsk(issue)}>
        Ask how to fix this
      </button>
    </article>
  );
}

/* ---------- one bot reply ---------- */
function BotBody({ m, onAsk }) {
  if (m.kind === "review") {
    if (m.issues.length === 0) {
      return (
        <article className="t-card">
          <div className="t-card-title">No issues found. Nice work.</div>
        </article>
      );
    }
    return m.issues.map((issue, k) => <IssueCard key={k} issue={issue} onAsk={onAsk} />);
  }

  if (m.kind === "docs") {
    const grouped = m.docs.reduce((acc, d) => {
      const key = d.filename || "file";
      acc[key] = { ...(acc[key] || {}), [d.doc_type]: d.content };
      return acc;
    }, {});
    return (
      <article className="t-card">
        <div className="t-card-title">Generated documentation</div>
        {Object.entries(grouped).map(([file, d]) => (
          <div key={file} className="t-doc">
            <div className="t-file">{file}</div>
            {d.docstring && (
              <>
                <div className="t-row">
                  <span className="t-sub">Docstring</span>
                  <CopyBtn text={d.docstring} />
                </div>
                <pre className="t-pre">{d.docstring}</pre>
              </>
            )}
            {d.readme && (
              <>
                <div className="t-row">
                  <span className="t-sub">README section</span>
                  <CopyBtn text={d.readme} />
                </div>
                <RichText text={d.readme} />
              </>
            )}
          </div>
        ))}
      </article>
    );
  }

  if (m.kind === "map") {
    const map = m.map ?? {};
    return (
      <article className="t-card">
        <div className="t-card-title">Codebase map</div>
        {map.overview && <div className="t-text">{map.overview}</div>}
        <div className="t-sub">Entry points</div>
        <FileChips items={map.entry_points} accent />
        <div className="t-sub">Utility files</div>
        <FileChips items={map.utility_files} />
        {map.reading_order?.length > 0 && (
          <>
            <div className="t-sub">Suggested reading order</div>
            <ol className="t-ol">
              {map.reading_order.map((f, i) => (
                <li key={f}><span className="t-num">{i + 1}</span>{f}</li>
              ))}
            </ol>
          </>
        )}
        {map.file_notes?.length > 0 && (
          <>
            <div className="t-sub">What each file does</div>
            <ul className="t-notes">
              {map.file_notes.map((n) => (
                <li key={n.filename}><b>{n.filename}</b> — {n.role}</li>
              ))}
            </ul>
          </>
        )}
      </article>
    );
  }

  return (
    <article className="t-card">
      <RichText text={m.text} />
    </article>
  );
}

/* ---------- main page ---------- */
export default function ChatApp() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [currentId, setCurrentId] = useState(null); // null = new project
  const [currentName, setCurrentName] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const chatRef = useRef(null);
  const fileRef = useRef(null);
  // project id -> messages, so review cards stay while you switch projects
  const cache = useRef({});
  const [menuId, setMenuId] = useState(null); // which project's 3-dot menu is open

  const project = projects.find((p) => p.id === currentId) ?? null;
  const codeMode = currentId === null;

  // severity badges come from the latest review shown in this chat
  const lastReview = [...messages].reverse().find((m) => m.kind === "review" && m.issues.length);
  const issues = lastReview?.issues ?? [];
  const count = (s) => issues.filter((i) => i.severity === s).length;

  const pushUser = (msg) => setMessages((all) => [...all, { role: "user", ...msg }]);
  const pushBot = (msg) => setMessages((all) => [...all, { role: "bot", ...msg }]);
  const botText = (value) => pushBot({ kind: "text", text: value });

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const fail = (err, fallback) => {
    if (err?.response?.status === 401) {
      logout();
      return;
    }
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.detail ||
      (err?.code === "ERR_NETWORK"
        ? "Backend se connect nahi ho paaya. Check karo ki server chal raha hai."
        : fallback);
    botText(String(msg));
  };

  async function fetchProjects() {
    try {
      const { data } = await api.get("/repositories/");
      setProjects(Array.isArray(data) ? data : data.results ?? []);
      setBackendError("");
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
      } else if (err?.code === "ERR_NETWORK") {
        setBackendError("Backend se connect nahi ho paaya. Django server (python manage.py runserver) chalu karo.");
      } else {
        setBackendError(`Backend ne error diya (${err?.response?.status ?? "unknown"}). Django terminal check karo.`);
      }
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  // close the 3-dot menu when clicking anywhere else
  useEffect(() => {
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (currentId !== null) cache.current[currentId] = messages;
  }, [messages, currentId]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages.length, loading]);

  function newProject() {
    setCurrentId(null);
    setCurrentName("");
    setMessages([]);
    setPendingFiles([]);
    setText("");
  }

  async function deleteProject(id) {
    setMenuId(null);
    const name = projects.find((p) => p.id === id)?.name ?? "this project";
    if (!window.confirm(`Delete "${name}"? Its files, reviews and chat will be permanently deleted.`)) return;
    try {
      await api.delete(`/repositories/${id}/`);
      delete cache.current[id];
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (id === currentId) newProject(); // opened project deleted -> clear chat
    } catch (err) {
      if (err?.response?.status === 401) logout();
      else alert("Could not delete project. Try again.");
    }
  }

  async function openProject(id) {
    if (loading || id === currentId) return;
    if (cache.current[id]) {
      setCurrentId(id);
      setCurrentName(projects.find((p) => p.id === id)?.name ?? "");
      setMessages(cache.current[id]);
      setPendingFiles([]);
      setText("");
      return;
    }
    setLoading(true);
    try {
      const [repo, chat] = await Promise.all([
        api.get(`/repositories/${id}/`),
        api.get(`/repositories/${id}/chat/`),
      ]);
      const files = (repo.data.files ?? []).map((f) => ({
        role: "user",
        kind: "code",
        filename: showName(f.filename),
        text: f.content,
      }));
      const history = chat.data.map((m) =>
        m.role === "user"
          ? { role: "user", kind: "text", text: m.content }
          : { role: "bot", kind: "text", text: m.content }
      );
      setCurrentId(id);
      setCurrentName(repo.data.name ?? "");
      setMessages([...files, ...history]);
      setPendingFiles([]);
      setText("");
    } catch (err) {
      fail(err, "Could not open this project.");
    }
    setLoading(false);
  }

  async function handleFiles(e) {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;
    try {
      const read = await Promise.all(picked.map(readFile));
      setPendingFiles((prev) => [...prev, ...read]);
    } catch {
      botText("Could not read that file. Try a plain text source file.");
    }
  }

  // Create the project if needed, upload the code, then run the AI review.
  async function submitCode(files) {
    setLoading(true);
    files.forEach((f) => pushUser({ kind: "code", filename: showName(f.name), text: f.content }));
    try {
      let id = currentId;
      if (id === null) {
        const first = files[0].name;
        const name = first.startsWith("snippet_") ? `Project ${projects.length + 1}` : first;
        const { data } = await api.post("/repositories/", {
          name,
          language: guessLanguage(first),
        });
        id = data.id;
        setCurrentId(id);
        setCurrentName(name);
        await fetchProjects();
      }

      for (const f of files) {
        await api.post(`/repositories/${id}/upload/`, { filename: f.name, content: f.content });
      }

      const { data } = await api.post(`/repositories/${id}/review/`);
      if (data.ai_unavailable) {
        botText("The AI reviewer is temporarily unavailable (rate limit reached). Please try again in a minute.");
      } else {
        pushBot({ kind: "review", issues: mapReviewResults(data.results) });
      }
    } catch (err) {
      fail(err, "Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function askFollowup(question, label) {
    if (currentId === null || loading) return;
    pushUser({ kind: "text", text: label ?? question });
    setLoading(true);
    try {
      const { data } = await api.post(`/repositories/${currentId}/chat/`, { message: question });
      botText(data.content);
    } catch (err) {
      fail(err, "Could not get a response. Try again.");
    }
    setLoading(false);
  }

  async function generateDocs() {
    if (currentId === null || loading) return;
    pushUser({ kind: "text", text: "Generate docs" });
    setLoading(true);
    try {
      const { data } = await api.post(`/repositories/${currentId}/docs/generate/`);
      const docs = Array.isArray(data) ? data : [];
      if (docs.length === 0) {
        botText("Documentation could not be generated right now. Please try again in a minute.");
      } else {
        pushBot({ kind: "docs", docs });
      }
    } catch (err) {
      fail(err, "Could not generate docs right now.");
    }
    setLoading(false);
  }

  async function mapCodebase() {
    if (currentId === null || loading) return;
    pushUser({ kind: "text", text: "Map codebase" });
    setLoading(true);
    try {
      const { data } = await api.post(`/repositories/${currentId}/codebase-map/`);
      pushBot({ kind: "map", map: data });
    } catch (err) {
      fail(err, "Could not generate the codebase map right now.");
    }
    setLoading(false);
  }

  function explainInMyLanguage() {
    askFollowup(
      `Explain what this code does in simple terms for a ${KNOWN_LANGUAGE} developer who does not know this language. Relate the logic to ${KNOWN_LANGUAGE} concepts and keep it short.`,
      "Explain in my language"
    );
  }

  function askHowToFix(issue) {
    askFollowup(
      `How do I fix this${issue.line ? ` (line ${issue.line})` : ""}? ${issue.title}`,
      "How do I fix this?"
    );
  }

  function send() {
    if (loading) return;
    if (pendingFiles.length > 0) {
      const files = pendingFiles;
      setPendingFiles([]);
      setText("");
      submitCode(files);
      return;
    }
    const value = text.trim();
    if (!value) return;
    setText("");
    if (codeMode) {
      submitCode([{ name: `snippet_${Date.now()}.py`, content: value }]);
    } else {
      askFollowup(value);
    }
  }

  // New project: Enter = new line, Ctrl+Enter sends (code is multi-line).
  // Open project: Enter sends, Shift+Enter = new line.
  const onKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const shouldSend = codeMode ? e.ctrlKey || e.metaKey : !e.shiftKey;
    if (shouldSend) {
      e.preventDefault();
      send();
    }
  };

  const chips = [
    ["Generate docs", generateDocs],
    ["Map codebase", mapCodebase],
    ["Explain in my language", explainInMyLanguage],
  ];

  const canSend = !loading && (pendingFiles.length > 0 || text.trim().length > 0);

  return (
    <div className="tufy-page">
      <div className="tufy">
        {/* Sidebar */}
        <aside className="t-sidebar">
          <div className="t-brand">
            <span className="t-logo">T</span>
            <span className="t-brand-name">Tufy</span>
          </div>

          <button className="t-btn-outline" onClick={newProject}>
            <PlusIcon /> New project
          </button>

          <p className="t-side-label">Recent</p>
          <nav className="t-recent">
            {projects.length === 0 && <span className="t-muted t-pad">No projects yet</span>}
            {[...projects].reverse().map((p) => (
              <div key={p.id} className="t-proj">
                <button
                  className={p.id === currentId ? "active" : ""}
                  onClick={() => openProject(p.id)}
                >
                  {p.name}
                </button>
                <button
                  className="t-dots-btn"
                  aria-label="Project options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuId(menuId === p.id ? null : p.id);
                  }}
                >
                  ⋯
                </button>
                {menuId === p.id && (
                  <div className="t-menu" onClick={(e) => e.stopPropagation()}>
                    <button className="danger" onClick={() => deleteProject(p.id)}>
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="t-side-bottom">
            <Link to="/team" className="t-side-link"><TeamIcon /> Team</Link>
            <Link to="/profile" className="t-side-link"><ProfileIcon /> Profile</Link>
          </div>
        </aside>

        {/* Main */}
        <main className="t-main">
          <header className="t-topbar">
            <h1>{project?.name || currentName || "New project"}</h1>
            <div className="t-badges">
              {SEVERITIES.map((s) => (
                <span key={s} className={`t-badge ${s}`}>
                  {count(s)} {s}
                </span>
              ))}
            </div>
          </header>

          <section className="t-chat" ref={chatRef}>
            {backendError && <div className="t-banner">{backendError}</div>}

            {messages.length === 0 && !loading ? (
              <div className="t-empty">
                <h2>Paste your code to get started</h2>
                <p>Tufy reviews it for bugs, security issues, and style problems.</p>
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className={m.kind === "code" ? "t-user-code" : "t-user-text"}>
                    {m.filename && <span className="t-filename">{m.filename}</span>}
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="t-reply">
                    <div className="t-avatar">T</div>
                    <div className="t-cards">
                      <BotBody m={m} onAsk={askHowToFix} />
                    </div>
                  </div>
                )
              )
            )}

            {loading && (
              <div className="t-reply">
                <div className="t-avatar">T</div>
                <div className="t-cards">
                  <article className="t-card" aria-label="Tufy is thinking">
                    <div className="t-dots"><span /><span /><span /></div>
                  </article>
                </div>
              </div>
            )}

            {!codeMode && !loading && messages.length > 0 && (
              <div className="t-chips t-chips-end">
                {chips.map(([label, fn]) => (
                  <button key={label} className="t-chip" onClick={fn}>{label}</button>
                ))}
              </div>
            )}
          </section>

          {pendingFiles.length > 0 && (
            <div className="t-pending">
              {pendingFiles.map((f, i) => (
                <span key={`${f.name}-${i}`} className="t-pfile">
                  {f.name}
                  <button
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <XIcon />
                  </button>
                </span>
              ))}
            </div>
          )}

          <footer className="t-composer">
            <button className="t-icon-btn" aria-label="Attach files" onClick={() => fileRef.current?.click()}>
              <ClipIcon />
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPT}
              onChange={handleFiles}
              className="t-hidden"
            />
            <textarea
              value={text}
              disabled={pendingFiles.length > 0}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={
                pendingFiles.length > 0
                  ? `Ready to review ${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"}. Press Send`
                  : codeMode
                  ? "Paste your code (Ctrl+Enter to send) or attach files"
                  : "Ask a follow-up question"
              }
            />
            <button className="t-send" onClick={send} disabled={!canSend}>Send</button>
          </footer>
        </main>
      </div>
    </div>
  );
}
