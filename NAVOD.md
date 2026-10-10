# Ako spustiť appku na recepty.poliacik.sk

Kód je hotový a otestovaný. Ty iba založíš projekty a do nich vložíš kľúče. Kľúče a heslá nikdy neposielaj do chatu. Vkladaj ich len tam, kde to píše tento návod.

## 1. GitHub: miesto na kód

1. Otvor https://github.com/new
2. Do „Repository name“ napíš **hanine-recepty** a zvoľ **Private**. Nič iné nezaškrtávaj.
3. Klikni na **Create repository** a napíš Claudovi do vlákna „repozitár je hotový“. Kód tam nahrám ja.
4. Ak by mi GitHub nedal prístup, otvor https://github.com/apps/claude/installations/select_target a pri svojom účte pridaj repozitár hanine-recepty.

## 2. Supabase: účty a databáza

1. V https://supabase.com/dashboard klikni na **New project**.
   - Name: **hanine-recepty**
   - Database password: vymysli si heslo a ulož si ho (Claude ho nepotrebuje).
   - Region: **Central EU (Frankfurt)**
2. Keď je projekt pripravený, otvor vľavo **SQL Editor**, klikni na **New query** a vlož celý text zo súboru [supabase.sql](supabase.sql). Nájdeš ho v súboroch projektu v priečinku recepty/web. Otvor ho, označ všetko (Cmd+A), skopíruj (Cmd+C) a v Supabase vlož (Cmd+V). Potom klikni na **Run**. Malo by sa zobraziť „Success“.
3. Vľavo otvor **Authentication**, potom **Sign In / Providers** a **Email**. Vypni **Confirm email** a klikni na **Save**. Kamarátky sa tak zaregistrujú bez potvrdzovacieho e-mailu.
4. Vľavo otvor **Project Settings** a **API Keys** (v niektorých verziách sa to volá **Data API**). Nájdi tam dve hodnoty, budeš ich potrebovať vo Verceli:
   - **Project URL** (vyzerá ako `https://abcd.supabase.co`)
   - verejný kľúč: **Publishable key** (`sb_publishable_…`) alebo v starom rozhraní **anon public** (`eyJ…`). **Secret ani service_role kľúč nikdy nekopíruj.**

## 3. Anthropic: kľúč na AI nápady

1. V https://console.anthropic.com otvor **API Keys**, klikni na **Create Key** a pomenuj ho „recepty“. Kľúč si skopíruj, vložíš ho do Vercelu.
2. V **Billing** si dobi kredit, napríklad 5 $.
3. V **Limits** si nastav mesačný strop, napríklad 10 $. Vyššiu sumu ti potom nikto nemôže minúť.

## 4. Vercel: spustenie appky

1. Vo https://vercel.com/new pri repozitári **hanine-recepty** klikni na **Import**.
2. Framework Preset nechaj **Other**.
3. Rozbaľ **Environment Variables** a pridaj tieto štyri:

   | Name (napíš presne takto) | Value (sem vlož skopírovanú hodnotu, nie popis) |
   |---|---|
   | `SUPABASE_URL` | adresa zo Supabase, napr. `https://abcdefgh.supabase.co` |
   | `SUPABASE_ANON_KEY` | kľúč zo Supabase, začína `eyJ…` alebo `sb_publishable_…` |
   | `ANTHROPIC_API_KEY` | kľúč z Anthropicu, začína `sk-ant-…` |
   | `DENNY_LIMIT` | `10` |

4. Klikni na **Deploy**. O chvíľu dostaneš adresu typu `hanine-recepty.vercel.app`.
5. **Zaregistruj sa ako prvá.** Prvý účet je správkyňa: vidí tvoj profil a diétu a môže označovať pripomienky ako vyriešené.

## 5. Webglobe: adresa recepty.poliacik.sk

1. Vo Verceli otvor projekt, potom **Settings** a **Domains**. Zadaj **recepty.poliacik.sk** a klikni na **Add**.
2. Vercel ti ukáže záznam typu **CNAME** a hodnotu, napríklad `cname.vercel-dns.com`. Hodnotu skopíruj presne tak, ako ju Vercel ukazuje.
3. V administrácii Webglobe otvor DNS pre doménu **poliacik.sk** a pridaj nový záznam:
   - Typ: **CNAME**
   - Názov: **recepty**
   - Hodnota: tá z Vercelu
4. Do niekoľkých hodín (často skôr) bude appka bežať na https://recepty.poliacik.sk. HTTPS zariadi Vercel sám.
5. V Supabase v **Authentication** a **URL Configuration** nastav Site URL na `https://recepty.poliacik.sk`.

## Pre kamarátky

- Pošli im odkaz https://recepty.poliacik.sk. Zaregistrujú sa menom, e-mailom a heslom.
- Na iPhone: otvoriť v Safari, ťuknúť na **Zdieľať** a potom **Pridať na plochu**. Appka sa potom otvára ako ikonka.
- Každá má vlastný plán, diétu a nákupný zoznam. Komentáre, fotky a pripomienky vidia všetky.
- Rohlík: namiesto plnenia košíka dostanú zoznam s odkazmi „Hľadať na Rohlíku“. Ty si košík môžeš naďalej plniť cez Claude.

## Čo to stojí

- Vercel, Supabase a GitHub: zadarmo.
- AI nápady: platíš iba to, čo sa použije, zhruba 1 až 5 centov za jedno vymýšľanie. Pri strope 10 $ mesačne sa nič neprekročí.
- Doménu poliacik.sk už máš, subdoména nič nestojí.

## Keď chceš niečo zmeniť

Napíš Claudovi. Úpravy pošle do GitHubu a Vercel ich sám nasadí.
