# Community Auth Forum

Forum-liknande webbapp med användarprofiler, fem valbara avatarer, inloggning (JWT) och meddelandevägg. Byggd som vidareutveckling av utbildningsprojektet **nodejs-3rd-challenge-api** — all git-historik från start till idag finns kvar i detta repo.

## Funktioner

- **Registrering** med avatar (1–5), bio och valfri e-post (unik)
- **Inloggning** (`POST /api/v1/auth/login`) — JWT i 7 dagar
- **Profiler** (`GET /api/v1/users/:username`) — egna inlägg på väggen
- **Redigera egen profil** (`PATCH`) — avatar, bio, namn
- **Radera eget konto** (`DELETE` + lösenord) — inte andras profiler
- **Meddelandevägg** — forum-känsla, länkar till profiler

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
| GET/POST | `/api/v1/wall` | Vägg |

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
