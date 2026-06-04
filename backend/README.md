# HealthMesh Emergency Triage — Backend

Backend complet du MVP **HealthMesh** : API REST, temps réel (WebSocket), IA de triage **TechY-Health**, et simulateur de capteurs IoT. Conçu pour la démonstration du concours de pitch J.U.I.N 2026.

> **Architecture** : le cahier des charges décrit une cible microservices. Pour un MVP réellement exécutable et démontrable, ce backend est implémenté comme un **monolithe modulaire** Node.js + Fastify (un seul process, modules clairement séparés). Le passage aux microservices est un découpage ultérieur sans changement de contrat d'API.

## Stack

| Couche | Techno |
|---|---|
| Runtime / API | Node.js 20 + Fastify 4 |
| Base de données | PostgreSQL 16 (+ TimescaleDB en prod) via Prisma |
| Temps réel | Socket.IO |
| Pub/Sub | Redis (optionnel — repli mémoire automatique) |
| Auth | JWT (access + refresh + offline) |
| IA triage | Moteur à règles (hors-ligne) ou LLM (Claude/GPT) |
| Simulateur | Générateur de mesures physiologiques (5 scénarios) |

## Démarrage rapide

### Option A — Tout en Docker (recommandé)

```bash
cd backend
docker compose up --build
```

Cela lance PostgreSQL (TimescaleDB), Redis et l'API, applique le schéma, injecte les données de démo et démarre le serveur sur `http://localhost:3000`.

### Option B — Local (Node + Postgres en Docker)

```bash
cd backend
cp .env.example .env          # Windows : copy .env.example .env
docker compose up -d postgres redis   # ou votre propre PostgreSQL
npm install
npm run prisma:generate
npm run prisma:push           # crée les tables
npm run db:seed               # données de démo
npm start
```

Vérification :

```bash
curl http://localhost:3000/health
# { "status": "ok", "redis": "connected", "ia_engine": "rules", ... }
```

Test de bout en bout :

```bash
npm run smoke
```

## Comptes de démo

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Agent terrain | `CM-001` | `Demo2026!` |
| Spécialiste | `spec@healthmesh.org` | `Demo2026!` |
| Admin | `admin@healthmesh.org` | `Admin2026!` |

## API (préfixe `/api/v1`)

Authentification : header `Authorization: Bearer <access_token>` sur toutes les routes sauf `/auth/*`.

- **Auth** : `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/offline-token`, `GET /auth/me`
- **Patients** : `GET/POST /patients`, `GET/PUT/DELETE /patients/:id`, `GET /patients/:id/{mesures,triages,alertes}`, `GET /patients/search`
- **Triage** : `POST /triage/sessions`, `PUT /triage/sessions/:id`, `POST /triage/sessions/:id/mesures`, `POST /triage/sessions/:id/analyze`, `PUT /triage/sessions/:id/complete`, `GET /triage/sessions[/:id]`
- **Alertes** : `GET /alertes`, `GET /alertes/:id`, `PUT /alertes/:id/prendre-en-charge`, `PUT /alertes/:id/resoudre`, `GET /alertes/stats`
- **Consultations** : `POST /consultations`, `GET /consultations/:id`, `GET /consultations/queue`, `PUT /consultations/:id`, `PUT /consultations/:id/end`
- **Sync hors-ligne** : `POST /sync/push`, `GET /sync/pull`, `GET /sync/status`, `POST /sync/resolve`
- **Rapports** : `GET /reports/{activity,vitals-trend,epidemio,agents-kpi,export}`
- **Simulateur** : `GET /simulator/scenarios`, `POST /simulator/start`, `POST /simulator/scenario`, `POST /simulator/stop`, `PUT /simulator/inject`, `GET /simulator/status`

## Temps réel (Socket.IO)

Connexion sur `/socket.io` avec le JWT dans `auth.token`. Rooms : `zone:{id}`, `session:{id}`, `consult:{id}`, `agent:{id}`, `role:{role}`.

Événements serveur → client : `alerte:nouvelle`, `alerte:mise_a_jour`, `mesure:live`, `triage:resultat`, `consultation:invitation`, `consultation:terminee`, `webrtc:signal`.

## Démo en 1 minute

```bash
# 1. Login agent
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login -H "content-type: application/json" \
  -d '{"code":"CM-001","password":"Demo2026!"}' | jq -r .access_token)

# 2. Créer patient + session
PID=$(curl -s -X POST localhost:3000/api/v1/patients -H "authorization: Bearer $TOKEN" \
  -H "content-type: application/json" -d '{"nom":"Demo","prenom":"Live","sexe":"M"}' | jq -r .id)
SID=$(curl -s -X POST localhost:3000/api/v1/triage/sessions -H "authorization: Bearer $TOKEN" \
  -H "content-type: application/json" -d "{\"patient_id\":\"$PID\"}" | jq -r .id)

# 3. Lancer un scénario de détérioration (alertes temps réel automatiques)
curl -X POST localhost:3000/api/v1/simulator/scenario -H "authorization: Bearer $TOKEN" \
  -H "content-type: application/json" -d "{\"session_id\":\"$SID\",\"scenario_name\":\"deterioration_lente\"}"
```

Scénarios disponibles : `patient_normal`, `deterioration_lente`, `crise_aigue`, `fievre_palustre`, `resolution_alerte`.

## IA TechY-Health

- `IA_ENGINE=rules` (défaut) : moteur déterministe, applique les règles critiques (SpO2 < 90 = ROUGE, FC > 140 = ROUGE…) + scoring. Fonctionne hors-ligne.
- `IA_ENGINE=llm` : utilise Claude (`ANTHROPIC_API_KEY`) ou GPT (`OPENAI_API_KEY`) via prompt système médical. Repli automatique sur les règles si l'appel échoue.

## TimescaleDB (production)

Après `prisma migrate deploy`, exécuter `prisma/timescale.sql` pour convertir `mesures` en hypertable.

## Structure

```
backend/
├── prisma/            schema.prisma, seed.js, timescale.sql
├── scripts/           smoke.js (test e2e)
├── src/
│   ├── server.js      assemblage Fastify + Socket.IO
│   ├── config.js      configuration (env)
│   ├── db.js          client Prisma
│   ├── redis.js       bus Pub/Sub (Redis ou mémoire)
│   ├── realtime.js    Socket.IO + helpers d'émission
│   ├── auth/          login/refresh + RBAC
│   ├── ia/            moteur de triage TechY-Health
│   ├── simulator/     profils + moteur de simulation
│   └── modules/       patients, triage, alertes, consultations, sync, reports, simulator
├── docker-compose.yml
└── Dockerfile
```
