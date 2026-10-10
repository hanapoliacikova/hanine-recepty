// Verejné nastavenia pre prehliadač (URL a verejný kľúč Supabase). Tajné kľúče sem nepatria.
module.exports = (req, res) => {
  res.setHeader("cache-control", "public, max-age=300");
  res.status(200).json({url: process.env.SUPABASE_URL || "", anonKey: process.env.SUPABASE_ANON_KEY || ""});
};
