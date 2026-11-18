import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "./Profile.css";

const EMPTY_USER = {
  name: "",
  username: "",
  email: "",
  role: "",
  language: "English",
  notify: true,
};

const EMPTY_COUNTS = { reviews: 0, critical: 0, major: 0, minor: 0 };

const LANGUAGES = ["English", "Hindi", "Hinglish", "Spanish", "French", "German"];

const BackIcon = () => (
  <svg viewBox="0 0 24 24" className="pf-icon"><path d="M15 5l-7 7 7 7" /></svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" className="pf-icon">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const initialsOf = (name) =>
  (name || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

// backend sends { name, username, email, role, language, notify, stats: {...} }
const splitProfile = (data) => {
  const { stats, ...user } = data;
  return { user: { ...EMPTY_USER, ...user }, counts: { ...EMPTY_COUNTS, ...(stats ?? {}) } };
};

export default function Profile() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(EMPTY_USER); // jo "saved" hai
  const [form, setForm] = useState(EMPTY_USER);   // jo abhi edit ho raha hai
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }

  useEffect(() => {
    api
      .get("/profile/")
      .then((res) => {
        const { user, counts } = splitProfile(res.data);
        setSaved(user);
        setForm(user);
        setCounts(counts);
      })
      .catch((err) => {
        if (err?.response?.status === 401) handleLogout();
        else showToast("Could not load your profile.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STATS = [
    { label: "Reviews", value: counts.reviews, cls: "" },
    { label: "Critical", value: counts.critical, cls: "critical" },
    { label: "Major", value: counts.major, cls: "major" },
    { label: "Minor", value: counts.minor, cls: "minor" },
  ];

  const dirty = JSON.stringify(saved) !== JSON.stringify(form);
  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.includes("@")) {
      showToast("Please enter a valid name and email.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch("/profile/", {
        name: form.name.trim(),
        email: form.email.trim(),
        language: form.language,
        notify: form.notify,
      });
      const { user, counts } = splitProfile(res.data);
      setSaved(user);
      setForm(user);
      setCounts(counts);
      showToast("Changes saved.");
    } catch (err) {
      if (err?.response?.status === 401) handleLogout();
      else showToast(err?.response?.data?.error || "Could not save changes.");
    }
    setSaving(false);
  }

  return (
    <div className="profile-page">
      <div className="pf-card">
        <header className="pf-head">
          <Link to="/app" className="pf-btn-outline">
            <BackIcon /> Back to chat
          </Link>
          <button className="pf-btn-outline" onClick={handleLogout}>
            <LogoutIcon /> Log out
          </button>
        </header>

        {/* User summary */}
        <section className="pf-user">
          <div className="pf-avatar">{initialsOf(saved.name || saved.username)}</div>
          <div>
            <h1>{loading ? "Loading..." : saved.name || saved.username}</h1>
            <p>@{saved.username} · {saved.role || "Member"}</p>
          </div>
        </section>

        <section className="pf-stats">
          {STATS.map((s) => (
            <div key={s.label} className="pf-stat">
              <span>{s.label}</span>
              <strong className={s.cls}>{s.value}</strong>
            </div>
          ))}
        </section>

        {/* Edit form */}
        <form className="pf-form" onSubmit={handleSave}>
          <h2>Account details</h2>

          <div className="pf-grid">
            <label>
              Full name
              <input value={form.name} onChange={set("name")} disabled={loading} />
            </label>
            <label>
              Username
              <input value={form.username} disabled />
            </label>
            <label className="wide">
              Email
              <input type="email" value={form.email} onChange={set("email")} disabled={loading} />
            </label>
          </div>

          <h2>Preferences</h2>

          <div className="pf-grid">
            <label>
              Explain reviews in
              <select value={form.language} onChange={set("language")} disabled={loading}>
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>

            <label className="pf-switch-row">
              <span>
                Email notifications
                <small>Get a summary when a review finishes.</small>
              </span>
              <input type="checkbox" checked={form.notify} onChange={set("notify")} disabled={loading} />
            </label>
          </div>

          <div className="pf-actions">
            <button
              type="button"
              className="pf-btn-outline"
              disabled={!dirty || saving}
              onClick={() => setForm(saved)}
            >
              Reset
            </button>
            <button type="submit" className="pf-btn-primary" disabled={!dirty || saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      {toast && <div className="pf-toast" role="status">{toast}</div>}
    </div>
  );
}



// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "./Profile.css";

// // import { useState, useEffect } from "react";
// // import api from "../api";

// /* ---------- STEP 1: starting data (baad me backend se aayega) ---------- */
// // const INITIAL_USER = {
// //   name: "Subhi Mehra",
// //   username: "Subhimehra",
// //   email: "subhi@gmail.com",
// //   role: "Backend intern",
// //   language: "English",
// //   notify: true,
// // };

// // const STATS = [
// //   { label: "Reviews", value: 12, cls: "" },
// //   { label: "Critical", value: 1, cls: "critical" },
// //   { label: "Major", value: 4, cls: "major" },
// //   { label: "Minor", value: 9, cls: "minor" },
// // ];

// const LANGUAGES = ["English", "Hindi", "Hinglish", "Spanish", "French", "German"];

// const BackIcon = () => (
//   <svg viewBox="0 0 24 24" className="pf-icon"><path d="M15 5l-7 7 7 7" /></svg>
// );
// const LogoutIcon = () => (
//   <svg viewBox="0 0 24 24" className="pf-icon">
//     <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
//   </svg>
// );

// const initialsOf = (name) =>
//   name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

// export default function Profile() {
//   const navigate = useNavigate();
//   const [saved, setSaved] = useState(INITIAL_USER); // jo "saved" hai
//   const [form, setForm] = useState(INITIAL_USER);   // jo abhi edit ho raha hai
//   const [toast, setToast] = useState("");

//   const dirty = JSON.stringify(saved) !== JSON.stringify(form);
//   const set = (key) => (e) =>
//     setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

//   function handleSave(e) {
//     e.preventDefault();
//     if (!form.name.trim() || !form.email.includes("@")) {
//       setToast("Please enter a valid name and email.");
//     } else {
//       setSaved(form); // TODO: yahan backend API call aayegi
//       setToast("Changes saved.");
//     }
//     setTimeout(() => setToast(""), 2500);
//   }

//   function handleLogout() {
//     // TODO: token / session clear karna jab backend jud jaye
//     navigate("/login");
//   }

//   return (
//     <div className="profile-page">
//       <div className="pf-card">
//         <header className="pf-head">
//           <Link to="/app" className="pf-btn-outline">
//             <BackIcon /> Back to chat
//           </Link>
//           <button className="pf-btn-outline" onClick={handleLogout}>
//             <LogoutIcon /> Log out
//           </button>
//         </header>

//         {/* User summary */}
//         <section className="pf-user">
//           <div className="pf-avatar">{initialsOf(saved.name)}</div>
//           <div>
//             <h1>{saved.name}</h1>
//             <p>@{saved.username} · {saved.role}</p>
//           </div>
//         </section>

//         <section className="pf-stats">
//           {STATS.map((s) => (
//             <div key={s.label} className="pf-stat">
//               <span>{s.label}</span>
//               <strong className={s.cls}>{s.value}</strong>
//             </div>
//           ))}
//         </section>

//         {/* Edit form */}
//         <form className="pf-form" onSubmit={handleSave}>
//           <h2>Account details</h2>

//           <div className="pf-grid">
//             <label>
//               Full name
//               <input value={form.name} onChange={set("name")} />
//             </label>
//             <label>
//               Username
//               <input value={form.username} disabled />
//             </label>
//             <label className="wide">
//               Email
//               <input type="email" value={form.email} onChange={set("email")} />
//             </label>
//           </div>

//           <h2>Preferences</h2>

//           <div className="pf-grid">
//             <label>
//               Explain reviews in
//               <select value={form.language} onChange={set("language")}>
//                 {LANGUAGES.map((l) => (
//                   <option key={l}>{l}</option>
//                 ))}
//               </select>
//             </label>

//             <label className="pf-switch-row">
//               <span>
//                 Email notifications
//                 <small>Get a summary when a review finishes.</small>
//               </span>
//               <input type="checkbox" checked={form.notify} onChange={set("notify")} />
//             </label>
//           </div>

//           <div className="pf-actions">
//             <button
//               type="button"
//               className="pf-btn-outline"
//               disabled={!dirty}
//               onClick={() => setForm(saved)}
//             >
//               Reset
//             </button>
//             <button type="submit" className="pf-btn-primary" disabled={!dirty}>
//               Save changes
//             </button>
//           </div>
//         </form>
//       </div>

//       {toast && <div className="pf-toast" role="status">{toast}</div>}
//     </div>
//   );
// }
