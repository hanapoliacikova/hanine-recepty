// Verejné nastavenia pre prehliadač (URL a verejný kľúč Supabase). Tajné kľúče sem nepatria.
module.exports = (req, res) => {
  res.setHeader("cache-control", "no-store");
  const url = String(process.env.SUPABASE_URL || "").trim().replace(/\/(rest|auth)\/v1.*$/, "").replace(/\/+$/, "");
  res.status(200).json({url, anonKey: String(process.env.SUPABASE_ANON_KEY || "").trim()});
};
