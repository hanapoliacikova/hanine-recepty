// Vymyslí nové recepty cez Claude API. Kľúč ostáva na serveri, každý môže denne len DENNY_LIMIT generovaní.
const SYSTEM = "Si kuchár, ktorý vymýšľa jednoduché domáce recepty po slovensky. Odpovedáš výhradne platným JSON presne podľa zadania, bez akéhokoľvek textu navyše. Ak požiadavka nesúvisí s receptami a varením, odpovedz prázdnym JSON poľom [].";

function parseJSON(text) {
  let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf("["), b = t.lastIndexOf("]");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return undefined;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({code: "error"});
  const SU = String(process.env.SUPABASE_URL || "").trim().replace(/\/(rest|auth)\/v1.*$/, "").replace(/\/+$/, ""), AK = String(process.env.SUPABASE_ANON_KEY || "").trim(), KEY = String(process.env.ANTHROPIC_API_KEY || "").trim();
  const LIMIT = Number(process.env.DENNY_LIMIT || 10);
  if (!SU || !AK || !KEY) return res.status(500).json({code: "error", error: "Chýba nastavenie na serveri."});

  const tok = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!tok) return res.status(401).json({code: "not_granted"});
  const who = await fetch(SU + "/auth/v1/user", {headers: {apikey: AK, authorization: "Bearer " + tok}});
  if (!who.ok) return res.status(401).json({code: "not_granted"});

  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const prompt = String(body.prompt || "").slice(0, 12000);
  if (prompt.length < 20) return res.status(400).json({code: "error"});

  const used = await fetch(SU + "/rest/v1/rpc/pouzi_napad", {
    method: "POST",
    headers: {apikey: AK, authorization: "Bearer " + tok, "content-type": "application/json"},
    body: JSON.stringify({limit_dna: LIMIT})
  });
  if (!used.ok) return res.status(500).json({code: "error", error: "Počítadlo nápadov nefunguje."});
  if (Number(await used.json()) < 0) return res.status(429).json({code: "limit"});

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {"x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
    body: JSON.stringify({model: process.env.CLAUDE_MODEL || "claude-sonnet-5-5", max_tokens: 6000, system: SYSTEM, messages: [{role: "user", content: prompt}]})
  });
  if (r.status === 429 || r.status === 529) return res.status(429).json({code: "rate_limited"});
  if (!r.ok) return res.status(502).json({code: "error", error: "Claude API vrátilo chybu " + r.status + "."});
  const j = await r.json();
  const data = parseJSON((j.content || []).filter(c => c.type === "text").map(c => c.text).join(""));
  if (data === undefined) return res.status(502).json({code: "invalid_json"});
  res.status(200).json({data});
};
