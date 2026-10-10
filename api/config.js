// Verejné nastavenia pre prehliadač (URL a verejný kľúč Supabase). Tajné kľúče sem nepatria.
function jeTajny(k) {
  if (/^sb_secret_/.test(k)) return true;
  const p = k.split(".")[1];
  if (!p) return false;
  try { return JSON.parse(Buffer.from(p, "base64").toString("utf8")).role === "service_role"; } catch (e) { return false; }
}
module.exports = (req, res) => {
  res.setHeader("cache-control", "no-store");
  const url = String(process.env.SUPABASE_URL || "").trim().replace(/\/(rest|auth)\/v1.*$/, "").replace(/\/+$/, "");
  const anonKey = String(process.env.SUPABASE_ANON_KEY || "").trim();
  if (jeTajny(anonKey)) return res.status(200).json({url, anonKey: "", chyba: "V SUPABASE_ANON_KEY je tajný kľúč. Vlož tam Publishable (anon) kľúč a tajný kľúč v Supabase vymeň."});
  res.status(200).json({url, anonKey});
};
