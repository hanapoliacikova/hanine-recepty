"""Zostaví public/index.html zo src/template.html a data/recepty.json. Spusti: python3 build.py"""
import json, pathlib
root = pathlib.Path(__file__).parent
data = json.loads((root / "data/recepty.json").read_text(encoding="utf-8"))
app = (root / "src/template.html").read_text(encoding="utf-8").replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
head = """<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fff4ec" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1220" media="(prefers-color-scheme: dark)">
<meta name="description" content="Jedlo, ktoré ti urobí dobre. Recepty, plán na týždeň, nákupný zoznam a nápady z toho, čo máš doma.">
<meta name="robots" content="noindex">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Recepty">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script src="/shim.js"></script>
</head>
<body>
"""
(root / "public").mkdir(exist_ok=True)
(root / "public/index.html").write_text(head + app + "\n</body>\n</html>\n", encoding="utf-8")
(root / "public/shim.js").write_text((root / "src/shim.js").read_text(encoding="utf-8"), encoding="utf-8")
print("public/index.html je hotový")
