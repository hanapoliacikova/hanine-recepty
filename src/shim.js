/* Hanine recepty: prihlásenie, ukladanie a AI nápady cez Supabase a /api/napady.
   Napodobňuje rozhranie window.claude, ktoré appka používa v Claude, takže kód appky ostáva rovnaký. */
(() => {
  window.HR_WEB = true;
  const T = "docs";
  let sb = null, session = null, me = null;
  const parent = p => p.split("/").slice(0, -1).join("/");
  const last = p => p.split("/").pop();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  /* ---------- prihlasovacia obrazovka ---------- */
  const css = `
  .hr-login{position:fixed;inset:0;z-index:50;background:var(--bg,#fff4ec);color:var(--ink,#2b1b2e);display:grid;place-items:center;padding:24px 16px;overflow:auto;font-family:var(--body,system-ui)}
  .hr-login[hidden]{display:none}
  .hr-card{width:min(420px,100%);display:grid;gap:18px}
  .hr-card h1{margin:0}
  .hr-card form{background:var(--surface,#fff);border-radius:28px;padding:20px;display:grid;gap:12px}
  .hr-card label{display:grid;gap:6px;font-weight:600;font-size:.95rem}
  .hr-card input{font:inherit;padding:13px 16px;border-radius:999px;border:2px solid var(--line,#f1ddd0);background:var(--bg,#fff4ec);color:var(--ink,#2b1b2e)}
  .hr-card input:focus{outline:none;border-color:var(--ink,#2b1b2e)}
  .hr-card .go{font:inherit;font-weight:800;font-size:1.05rem;border:0;border-radius:999px;padding:15px;background:var(--accent,#ff5a3c);color:#fff;cursor:pointer}
  .hr-card .go:disabled{opacity:.6}
  .hr-card .sw{font:inherit;font-weight:700;border:0;background:none;color:var(--ink,#2b1b2e);text-decoration:underline;cursor:pointer;padding:4px;justify-self:center}
  .hr-card .err{margin:0;color:var(--tomato,#d63a1f);font-weight:600;min-height:1.2em}
  .hr-card .tag{display:flex;gap:6px;font-family:var(--emoji);font-size:2rem}
  .hr-out{font:inherit;font-size:.85rem;font-weight:700;border:0;border-radius:999px;padding:6px 13px;background:var(--surface,#fff);color:var(--ink,#2b1b2e);cursor:pointer}`;
  let box = null;
  function loginUI() {
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    box = document.createElement("div"); box.className = "hr-login"; box.hidden = true;
    box.innerHTML = `<div class="hr-card">
      <div class="tag" aria-hidden="true">🥥🫘🍅</div>
      <h1>Čo ti dnes <em>urobí dobre?</em></h1>
      <p class="lede" id="hrLede" style="margin:0">Prihlás sa a vyber si, čo si dnes dáš.</p>
      <form id="hrForm" novalidate>
        <label id="hrNameL" hidden>Ako ti máme hovoriť<input id="hrName" autocomplete="given-name" maxlength="40" placeholder="Napr. Zuzka"></label>
        <label>E-mail<input id="hrMail" type="email" autocomplete="email" required></label>
        <label>Heslo<input id="hrPass" type="password" autocomplete="current-password" minlength="6" required></label>
        <p class="err" id="hrErr" role="alert"></p>
        <button class="go" type="submit" id="hrGo">Prihlásiť sa</button>
        <button class="sw" type="button" id="hrSw">Nemám účet, chcem sa zaregistrovať</button>
      </form></div>`;
    document.body.appendChild(box);
  }
  function askLogin() {
    return new Promise(resolve => {
      let reg = false;
      const $ = id => document.getElementById(id);
      const mode = () => {
        $("hrNameL").hidden = !reg; $("hrGo").textContent = reg ? "Vytvoriť účet" : "Prihlásiť sa";
        $("hrSw").textContent = reg ? "Už mám účet, chcem sa prihlásiť" : "Nemám účet, chcem sa zaregistrovať";
        $("hrPass").autocomplete = reg ? "new-password" : "current-password"; $("hrErr").textContent = "";
      };
      $("hrSw").onclick = () => { reg = !reg; mode(); };
      $("hrForm").onsubmit = async e => {
        e.preventDefault();
        const email = $("hrMail").value.trim(), password = $("hrPass").value, name = $("hrName").value.trim();
        if (!email || !email.includes("@")) return void ($("hrErr").textContent = "Napíš svoj e-mail.");
        if (password.length < 6) return void ($("hrErr").textContent = "Heslo musí mať aspoň 6 znakov.");
        if (reg && !name) return void ($("hrErr").textContent = "Napíš, ako ti máme hovoriť.");
        $("hrGo").disabled = true; $("hrErr").textContent = "";
        try {
          const r = reg ? await sb.auth.signUp({email, password, options:{data:{name}}}) : await sb.auth.signInWithPassword({email, password});
          if (r.error) throw r.error;
          if (!r.data.session) { $("hrErr").textContent = "Pozri si e-mail a potvrď registráciu, potom sa prihlás."; reg = false; mode(); return; }
          box.hidden = true; resolve(r.data.session);
        } catch (err) {
          const m = String(err && err.message || "");
          $("hrErr").textContent = /invalid login/i.test(m) ? "Nesprávny e-mail alebo heslo."
            : /already registered/i.test(m) ? "Tento e-mail už má účet. Prihlás sa."
            : /rate limit/i.test(m) ? "Veľa pokusov naraz. Skús to o chvíľu."
            : "Nepodarilo sa. Skús to znova.";
        } finally { $("hrGo").disabled = false; }
      };
      mode(); box.hidden = false; setTimeout(() => $("hrMail").focus(), 50);
    });
  }
  function accountButton() {
    const h = document.querySelector(".hello"); if (!h || document.querySelector(".hr-out")) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "hr-out"; b.textContent = "Odhlásiť";
    b.onclick = async () => { if (!confirm("Odhlásiť sa?")) return; try { localStorage.removeItem("hr-plan"); localStorage.removeItem("hr-ideas"); } catch (e) {} await sb.auth.signOut(); location.reload(); };
    h.appendChild(b);
  }

  const ready = (async () => {
    if (document.readyState === "loading") await new Promise(r => document.addEventListener("DOMContentLoaded", r, {once:true}));
    loginUI();
    const cfg = await fetch("/api/config").then(r => r.json()).catch(() => ({}));
    if (!cfg.url || !cfg.anonKey) throw Object.assign(new Error("config"), {hr:"Chýba nastavenie Supabase. Vo Verceli skontroluj Environment Variables SUPABASE_URL a SUPABASE_ANON_KEY a daj Redeploy."});
    if (!window.supabase) throw Object.assign(new Error("lib"), {hr:"Nenačítala sa knižnica Supabase. Skús obnoviť stránku."});
    sb = window.supabase.createClient(cfg.url, cfg.anonKey, {auth:{persistSession:true, autoRefreshToken:true}});
    session = (await sb.auth.getSession()).data.session;
    if (!session) session = await askLogin();
    sb.auth.onAuthStateChange((ev, s) => { if (s) session = s; if (ev === "SIGNED_OUT") location.reload(); });
    const {data} = await sb.from("profiles").select("id,name,is_admin").eq("id", session.user.id).maybeSingle();
    me = data || {id:session.user.id, name:"", is_admin:false};
    accountButton();
  })();
  ready.catch(e => { console.error(e); const m = (e && e.hr) || "Appku sa nepodarilo spustiť (" + esc(String(e && e.message || e).slice(0, 160)) + "). Skús obnoviť stránku."; document.body.insertAdjacentHTML("afterbegin", `<p style="padding:16px;font-weight:700">${m}</p>`); });

  /* ---------- dáta ---------- */
  const watchers = new Map(), channels = new Set();
  function refresh(coll) { (watchers.get(coll) || []).forEach(w => w.run()); }
  function watch(coll, run, onErr) {
    const w = {run:() => run().catch(e => onErr && onErr(e))};
    if (!watchers.has(coll)) watchers.set(coll, []);
    watchers.get(coll).push(w);
    ready.then(() => {
      w.run();
      if (!channels.has(coll)) {
        channels.add(coll);
        sb.channel("docs:" + coll).on("postgres_changes", {event:"*", schema:"public", table:T, filter:"coll=eq." + coll}, () => refresh(coll)).subscribe();
      }
    });
    return () => { const a = watchers.get(coll) || []; a.splice(a.indexOf(w), 1); };
  }
  setInterval(() => { if (document.visibilityState === "visible") watchers.forEach((_, c) => refresh(c)); }, 60000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") watchers.forEach((_, c) => refresh(c)); });

  const snap = (path, row) => ({id:last(path), exists:!!row, data:() => row ? row.data : undefined});
  const doc = path => ({
    async get() { await ready; const {data, error} = await sb.from(T).select("path,data").eq("path", path).maybeSingle(); if (error) throw error; return snap(path, data); },
    async set(d) { await ready; const {error} = await sb.from(T).upsert({path, coll:parent(path), owner:session.user.id, data:d, updated_at:new Date().toISOString()}); if (error) throw error; refresh(parent(path)); },
    async delete() { await ready; const {error} = await sb.from(T).delete().eq("path", path); if (error) throw error; refresh(parent(path)); },
    onSnapshot(fn, onErr) { return watch(parent(path), async () => fn(await doc(path).get()), onErr); }
  });
  const collection = path => ({
    onSnapshot(fn, onErr) { return watch(path, async () => { const {data, error} = await sb.from(T).select("path,data").eq("coll", path); if (error) throw error; fn({docs:data.map(r => snap(r.path, r))}); }, onErr); }
  });

  /* ---------- používateľ ---------- */
  const COLORS = ["#ffd449", "#d9c8ff", "#b9e28c", "#ffd0c4", "#cfe8ff", "#f9cfe4"];
  const avatar = (id, name) => {
    const c = COLORS[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="${c}"/><text x="20" y="26" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="700" fill="#2b1b2e">${esc((name || "?").trim().charAt(0).toUpperCase() || "?")}</text></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  };
  const user = {
    async id() { await ready; return session.user.id; },
    async isOwner() { await ready; return !!me.is_admin; },
    async profiles(ids) {
      await ready;
      const {data} = await sb.from("profiles").select("id,name").in("id", [].concat(ids));
      return Object.fromEntries((data || []).map(p => [p.id, {id:p.id, name:p.name, avatarUrl:avatar(p.id, p.name), isMe:p.id === session.user.id}]));
    }
  };

  /* ---------- AI nápady ---------- */
  const fail = (code, msg) => Object.assign(new Error(msg || code), {code});
  const sample = Object.assign(async () => ({text:""}), {
    async json(prompt, opts = {}) {
      await ready;
      const tok = ((await sb.auth.getSession()).data.session || session).access_token;
      let r;
      try { r = await fetch("/api/napady", {method:"POST", headers:{"content-type":"application/json", authorization:"Bearer " + tok}, body:JSON.stringify({prompt}), signal:opts.signal}); }
      catch (e) { throw fail(e && e.name === "AbortError" ? "cancelled" : "network"); }
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw fail(j.code || "error", j.error);
      return j.data;
    }
  });

  window.claude = {use:async n => ({db:{doc, collection}, user, sample})[n] || null};
})();
