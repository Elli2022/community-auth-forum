# Flödet

Socialt nätverk (tidigare *Community Auth Forum* / *nodejs-3rd-challenge-api*).

Forum-liknande webbapp med användarprofiler, fem valbara avatarer, inloggning (JWT) och meddelandevägg. Byggd som vidareutveckling av utbildningsprojektet **nodejs-3rd-challenge-api** — all git-historik från start till idag finns kvar i detta repo.

## Funktioner

- **Registrering** med förvald avatar (1–5) eller **egen uppladdad profilbild**
- **Inloggning** (JWT) och **nyhetsflöde** (egna vänner + egna inlägg)
- **Profiler** med omslagsfärg, bio, tidslinje och vänförfrågningar
- **Inlägg** med text och bild, **gilla** och **kommentera**
- **Vänner** — skicka/acceptera förfrågningar
- **Radera eget konto** — inte andras profiler

## Stack

- Node.js 20+, Express 4, TypeScript
- PostgreSQL (Neon i produktion, Docker lokalt)
- Netlify (statisk UI + serverless API)
- bcrypt, sanitize-html, helmet, JWT

## API (v1)

| Metod | Sökväg | Beskrivning |
|-------|--------|-------------|
| GET | `/api/v1/` | Lista medlemmar |
| POST | `/api/v1/` | Registrera |
| POST | `/api/v1/auth/login` | Logga in |
| GET | `/api/v1/users/:username` | Profil + inlägg |
| PATCH | `/api/v1/users/:username` | Uppdatera egen profil (JWT) |
| DELETE | `/api/v1/users/:username` | Radera eget konto (JWT) |
| GET | `/api/v1/feed` | Nyhetsflöde (vänner + du) |
| GET/POST | `/api/v1/wall` | Vägg (POST kräver inloggning) |
| POST | `/api/v1/posts/:id/like` | Gilla / ta bort gilla |
| POST | `/api/v1/posts/:id/comments` | Kommentera |
| GET | `/api/v1/users/:username/avatar` | Egen uppladdad profilbild |
| GET/POST | `/api/v1/friends` | Vänner och förfrågningar |

## Lokalt

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run dev
```

Öppna `http://127.0.0.1:3000` — profiler via `#/profile/användarnamn`.

## Miljövariabler

- `DATABASE_URL` — PostgreSQL
- `JWT_SECRET` — obligatoriskt i produktion

## Deploy (Netlify)

Produktionssajt efter namnbyte: **https://community-auth-forum.netlify.app** (tidigare `nodejs-3rd-challenge-api`).

## Historik

Projektet började som Node.js 3rd challenge / authentication microservice (`nodejs-3rd-challenge-api`). Repot och Netlify har bytt namn till **community-auth-forum**; commits och branches är oförändrade.
