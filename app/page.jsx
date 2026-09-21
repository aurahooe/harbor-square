"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [mine, setMine] = useState([]);
  const [hour, setHour] = useState(null);
  const [featured, setFeatured] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadWall();
    fetch("/api/hour").then((r) => r.json()).then((d) => {
      setHour(d.hour || null);
      setFeatured(d.featured || null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setMine([]);
      return;
    }
    supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
    supabase.from("notes").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false })
      .then(({ data }) => setMine(data || []));
  }, [session]);

  async function loadWall() {
    const { data } = await supabase
      .from("notes")
      .select("id,title,body,created_at,user_id,is_public,profiles(handle,display_name)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(36);
    setNotes(data || []);
  }

  function toast(t) {
    setMsg(t);
    setTimeout(() => setMsg(""), 2400);
  }

  async function submitAuth(e) {
    e.preventDefault();
    setBusy(true);
    const fn = authMode === "signup"
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) toast(error.message);
    else toast(authMode === "signup" ? "Account ready. Check email if asked." : "Welcome back.");
  }

  async function saveNote(e) {
    e.preventDefault();
    if (!session?.user) return toast("Sign in first.");
    if (!body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("notes").insert({
      user_id: session.user.id,
      title: title.trim() || "Untitled",
      body: body.trim(),
      is_public: isPublic,
    });
    setBusy(false);
    if (error) return toast(error.message);
    setTitle("");
    setBody("");
    toast(isPublic ? "On the wall." : "Kept at your desk.");
    loadWall();
    const { data } = await supabase.from("notes").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
    setMine(data || []);
  }

  async function togglePublic(note) {
    const { error } = await supabase.from("notes").update({ is_public: !note.is_public }).eq("id", note.id);
    if (error) return toast(error.message);
    setMine((xs) => xs.map((n) => n.id === note.id ? { ...n, is_public: !n.is_public } : n));
    loadWall();
  }

  const nextHour = useMemo(() => {
    const d = new Date();
    d.setMinutes(60, 0, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [hour]);

  return (
    <div className="wrap">
      <header className="top">
        <div className="mark">Harbor Square<b>A public wall that keeps time.</b></div>
        <nav className="topnav">
          {session ? (
            <>
              <span className="mark">{profile?.handle || session.user.email}</span>
              <button className="ghost" onClick={() => supabase.auth.signOut()}>Leave</button>
            </>
          ) : (
            <a className="btn" href="#desk">Sign in</a>
          )}
        </nav>
      </header>

      <section className="hero">
        <div>
          <h1>What people mark public<br/>stays on the wall.</h1>
          <p className="lede">
            Write at the desk. Keep a note private if you want. Flip it public and it walks out into the square.
            Every hour the house picks a line and hangs a new pulse.
          </p>
        </div>
        <aside className="pulse">
          <div className="kicker">This hour</div>
          <h2>{hour?.headline || "The hour is still warming up."}</h2>
          <p>{hour?.editorial || "When the clock turns, a public note is featured here."}</p>
          {featured?.body && (
            <p style={{ marginTop: 14, color: "var(--ink)" }}>
              “{featured.body.slice(0, 180)}{featured.body.length > 180 ? "…" : ""}”
            </p>
          )}
          <div className="meta">Next pulse around {nextHour}</div>
        </aside>
      </section>

      <h2 style={{ letterSpacing: "-0.03em", margin: "8px 0 18px" }}>On the wall</h2>
      <div className="grid">
        {notes.map((n, i) => (
          <article className="card" key={n.id} style={{ animationDelay: `${i * 30}ms` }}>
            <h3>{n.title || "Untitled"}</h3>
            <p>{n.body}</p>
            <div className="meta">
              {(n.profiles?.display_name || n.profiles?.handle || "someone")} · {new Date(n.created_at).toLocaleString()}
            </div>
          </article>
        ))}
        {!notes.length && <p className="lede">Empty wall. Be the first to pin something public.</p>}
      </div>

      <section className="desk" id="desk">
        <div>
          {!session ? (
            <form className="compose" onSubmit={submitAuth}>
              <div className="kicker">Desk</div>
              <h2 style={{ marginTop: 8 }}>Sign in to write</h2>
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              <label>Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={6} required />
              <div className="row">
                <button disabled={busy} type="submit">{authMode === "signup" ? "Create desk" : "Open desk"}</button>
                <button type="button" className="ghost" onClick={() => setAuthMode(authMode === "signup" ? "signin" : "signup")}>
                  {authMode === "signup" ? "I already have one" : "New here"}
                </button>
              </div>
            </form>
          ) : (
            <form className="compose" onSubmit={saveNote}>
              <div className="kicker">Your desk</div>
              <h2 style={{ marginTop: 8 }}>Leave a note</h2>
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short name" />
              <label>Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What should stay." required />
              <label className="check">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                Mark public — show it on the wall
              </label>
              <div className="row">
                <button className="accent" disabled={busy} type="submit">Save</button>
              </div>
            </form>
          )}
        </div>
        <div className="panel">
          <div className="kicker">Kept here</div>
          <h2 style={{ marginTop: 8 }}>Your notes</h2>
          {!session && <p className="lede">Sign in and they persist. Public ones also live on the wall for everyone.</p>}
          {mine.map((n) => (
            <article className="card" key={n.id}>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <div className="row">
                <span className="meta">{n.is_public ? "Public" : "Private"}</span>
                <button className="ghost" type="button" onClick={() => togglePublic(n)}>
                  {n.is_public ? "Make private" : "Make public"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}
