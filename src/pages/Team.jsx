import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Team.css";

/* ---------- backend ----------
   GET  /api/teams/                      teams you lead or belong to
   POST /api/teams/                      { name }            -> create a team (you become the lead)
   GET  /api/teams/<id>/dashboard/       -> { team_name, you_are_lead, members: [...] }
   POST /api/teams/<id>/add-member/      { username }        -> add an existing user
*/

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="tm-icon"><path d="M12 5v14M5 12h14" /></svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" className="tm-icon"><path d="M15 5l-7 7 7 7" /></svg>
);

// "arjun_k" -> "AK", "nandini" -> "NA"
const initialsOf = (username) => {
  const parts = String(username).split(/[\s_.-]+/).filter(Boolean);
  const text = parts.length > 1 ? parts[0][0] + parts[1][0] : String(username).slice(0, 2);
  return text.toUpperCase();
};

// dashboard row from Django -> row used by the table below
const toRow = (m) => ({
  id: m.username,
  name: m.is_lead ? `${m.username} (lead)` : m.username,
  initials: initialsOf(m.username),
  reviews: m.total_reviews,
  critical: m.critical_issues,
  major: m.major_issues,
  minor: m.minor_issues,
});

export default function Team() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [busy, setBusy] = useState(false);

  const members = (dashboard?.members ?? []).map(toRow);
  const sum = (key) => members.reduce((t, m) => t + m[key], 0);
  const stats = [
    { label: "Total reviews", value: sum("reviews"), cls: "" },
    { label: "Critical", value: sum("critical"), cls: "critical" },
    { label: "Major", value: sum("major"), cls: "major" },
    { label: "Minor", value: sum("minor"), cls: "minor" },
  ];

  // One place that turns a failed request into a message (or sends you to log in).
  const handleError = (err, fallback) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/login");
      return fallback;
    }
    if (err?.code === "ERR_NETWORK") {
      return "Backend se connect nahi ho paaya. Check karo ki Django server chal raha hai.";
    }
    return err?.response?.data?.error || err?.response?.data?.detail || fallback;
  };

  async function loadTeams(selectId) {
    try {
      const { data } = await api.get("/teams/");
      const list = Array.isArray(data) ? data : data.results ?? [];
      setTeams(list);
      setTeamId(selectId ?? list[0]?.id ?? null);
      setError("");
    } catch (err) {
      setError(handleError(err, "Could not load your teams."));
    }
    setLoading(false);
  }

  async function loadDashboard(id) {
    try {
      const { data } = await api.get(`/teams/${id}/dashboard/`);
      setDashboard(data);
      setError("");
    } catch (err) {
      setError(handleError(err, "Could not load this team."));
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (teamId !== null) loadDashboard(teamId);
    else setDashboard(null);
  }, [teamId]);

  // Esc closes the dialog
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function createTeam(e) {
    e.preventDefault();
    const name = newTeam.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post("/teams/", { name });
      setNewTeam("");
      await loadTeams(data.id);
    } catch (err) {
      setError(handleError(err, "Could not create the team."));
    }
    setBusy(false);
  }

  async function addMember(e) {
    e.preventDefault();
    const clean = username.trim();
    if (!clean || busy) return;
    setBusy(true);
    setDialogError("");
    try {
      await api.post(`/teams/${teamId}/add-member/`, { username: clean });
      setUsername("");
      setOpen(false);
      await loadDashboard(teamId);
    } catch (err) {
      setDialogError(handleError(err, "Could not add this member."));
    }
    setBusy(false);
  }

  function openDialog() {
    setUsername("");
    setDialogError("");
    setOpen(true);
  }

  const title = dashboard?.team_name ?? "Your team";
  const subtitle = loading
    ? "Loading..."
    : teamId === null
    ? "No team yet"
    : `${members.length} member${members.length === 1 ? "" : "s"}`;



  return (
    <div className="team-page">
      <div className="tm-card">
        <header className="tm-head">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="tm-actions">
            {teams.length > 1 && (
              <select
                className="tm-select"
                value={teamId ?? ""}
                onChange={(e) => setTeamId(Number(e.target.value))}
                aria-label="Choose team"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <Link to="/app" className="tm-btn-outline">
              <BackIcon /> Back to chat
            </Link>
            {dashboard?.you_are_lead && (
              <button className="tm-btn-primary" onClick={openDialog}>
                <PlusIcon /> Add member
              </button>
            )}
          </div>
        </header>

        {error && <div className="tm-banner" role="alert">{error}</div>}

        {!loading && teamId === null && !error && (
          <form className="tm-empty" onSubmit={createTeam}>
            <h2>Create your team</h2>
            <p>Add your teammates by username and see their review stats in one place.</p>
            <div className="tm-create">
              <input
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                placeholder="e.g. Backend interns"
              />
              <button type="submit" className="tm-btn-primary" disabled={busy || !newTeam.trim()}>
                {busy ? "Creating..." : "Create team"}
              </button>
            </div>
          </form>
        )}

        {teamId !== null && dashboard && (
          <>
            <section className="tm-stats">
              {stats.map((s) => (
                <div key={s.label} className="tm-stat">
                  <span>{s.label}</span>
                  <strong className={s.cls}>{s.value}</strong>
                </div>
              ))}
            </section>

            <div className="tm-table-wrap">
              <table className="tm-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Reviews</th>
                    <th>Critical</th>
                    <th>Major</th>
                    <th>Minor</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="tm-member">
                          <span className="tm-avatar">{m.initials}</span>
                          {m.name}
                        </div>
                      </td>
                      <td>{m.reviews}</td>
                      <td className="critical">{m.critical}</td>
                      <td className="major">{m.major}</td>
                      <td className="minor">{m.minor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {open && (
        <div className="tm-overlay" onClick={() => setOpen(false)}>
          <form className="tm-dialog" onClick={(e) => e.stopPropagation()} onSubmit={addMember}>
            <h2>Add member</h2>
            <p>Enter the username of a person who already has a Tufy account.</p>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sneha_verma"
            />
            {dialogError && <div className="tm-error" role="alert">{dialogError}</div>}
            <div className="tm-dialog-actions">
              <button type="button" className="tm-btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="tm-btn-primary" disabled={busy || !username.trim()}>
                {busy ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
