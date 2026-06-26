# Sennara — Egyptian Fishing Community

A cross-platform mobile application and scalable backend for Egyptian anglers, inspired by Fishbrain but rebuilt for local waters, local species, local payment methods, and Egyptian Arabic first.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Mobile | **Flutter 3.x** | First-class RTL/Arabic support, single codebase for iOS & Android, excellent map plugins, offline SQLite via Drift |
| Backend | **Node.js + Express + TypeScript** | Mature ecosystem, easy REST coexistence, strong typing |
| Database | **PostgreSQL 15+ + PostGIS 3.4+** | Geospatial queries, relational social graph, JSONB for flexible weather/metadata |
| Cache | **Redis** | Feed caching, weather TTL, OTP rate limiting, offline queue lock |
| Search | **PostgreSQL full-text + trigram** | Species/local-name search without extra infra at early stage |
| Maps | **Mapbox** | Offline tile packs, marine style layers |
| Auth | **Phone OTP** (SMSMISR/Twilio) + Google/Apple Sign-In | Mobile-first Egypt identity |
| Payments | **Paymob / PayTabs / InstaPay** adapters + Vodafone Cash, Fawry, card | Local payment reality |
| Object Storage | **MinIO** | S3-compatible, self-hosted media storage |
| Monitoring | **Prometheus + Grafana** | Metrics, dashboards, alerting |
| Load Balancing | **Nginx** | Reverse proxy, SSL, rate limiting |
| Orchestration | **Docker Compose** → **Docker Swarm** | Start on one machine, grow to a cluster |

## Repository Layout

```
sennara/
├── backend/                  # Node.js API
│   src/
│   ├── config/               # DB, Redis, env
│   ├── modules/
│   │   ├── auth/             # OTP, JWT, social login
│   │   ├── catches/          # Catch CRUD, feed
│   │   ├── species/          # Taxonomy endpoints
│   │   ├── waypoints/        # PostGIS waypoints
│   │   ├── weather/          # Marine weather adapters
│   │   ├── feed/             # Timeline, likes, comments, friendships
│   │   ├── payments/         # Subscriptions, local gateways
│   │   └── uploads/          # Pre-signed upload URLs
│   ├── jobs/                 # BullMQ background workers
│   ├── config/               # DB, Redis, S3, queue, metrics
│   └── shared/               # i18n helpers, middleware, errors, metrics
├── mobile/                   # Flutter app
│   lib/
│   ├── core/                 # Theme, l10n, constants, network
│   ├── data/                 # Models, remote API, local Drift DB
│   └── features/             # auth, map, feed, logbook, weather, species, payment
│   assets/lang/              # ar.json, en.json
├── database/
│   ├── migrations/           # *.sql migrations
│   └── seeds/                # Species seed, test data
├── infrastructure/           # Nginx, Prometheus, Grafana configs
└── docker-compose.yml        # Full self-hosted production stack
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth
- `POST /auth/otp/request` — send OTP to Egyptian phone number
- `POST /auth/otp/verify` — verify OTP and receive JWT pair
- `POST /auth/social` — Google/Apple sign-in
- `POST /auth/refresh` — refresh access token
- `GET /auth/me` — current user

### Catches
- `POST /catches` — log a catch with GPS/weather
- `GET /catches` — privacy-aware feed (`nearby`, `following`, `trending`)
- `GET /catches/:id` — single catch
- `PATCH /catches/:id` — update
- `DELETE /catches/:id` — delete

### Waypoints
- `POST /waypoints` — create waypoint
- `GET /waypoints/nearby` — nearby public/friends/own waypoints
- `GET /waypoints/:id` — single waypoint
- `PATCH /waypoints/:id` — update
- `DELETE /waypoints/:id` — delete

### Social / Feed
- `POST /feed/catches/:catchId/like` — toggle "Nice Catch" / تحية
- `GET /feed/catches/:catchId/comments`
- `POST /feed/catches/:catchId/comments`
- `POST /feed/catches/:catchId/share`
- `GET /feed/friendships`
- `POST /feed/friendships/request`
- `PATCH /feed/friendships/:userId/respond`

### Weather
- `GET /weather/current?lat=&lng=`
- `GET /weather/forecast?lat=&lng=&days=`

### Species
- `GET /species?q=&limit=&offset=` — list/search species
- `GET /species/:id` — species details

### Uploads
- `POST /uploads/presign` — get a pre-signed URL to upload a photo/video directly to MinIO

### Payments
- `GET /payments/pricing`
- `POST /payments/initiate`
- `POST /payments/webhooks/:provider`

## Getting Started

### 1. Database

Requires PostgreSQL 15+ with PostGIS 3.4+ and `uuid-ossp` extension.

**Option A: Docker Compose**

```bash
docker-compose up -d
```

**Option B: Local PostgreSQL**

```bash
createdb sennara_dev
psql sennara_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql sennara_dev -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

psql sennara_dev < database/migrations/001_initial_schema.sql
psql sennara_dev < database/seeds/001_species.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### 3. Mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Docker Deployment (Self-Hosted)

### Quick Start

```bash
# 1. Set secrets
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET

# 2. Build and start the full stack
docker compose up -d

# 3. Run migrations and create MinIO bucket
docker compose --profile migrate --profile setup run --rm migrate
docker compose --profile setup run --rm createbuckets

# 4. Scale API horizontally
docker compose up -d --scale api=3
```

### Windows / WSL2 Quick Notes

1. Clone the repo inside WSL (e.g. `~/sennara`) instead of `/mnt/c/...` for much better Docker file-system performance.
2. Make sure Docker Desktop is running with the **WSL2 backend** enabled for your distro.
3. Run all `docker compose` commands from a WSL terminal (Ubuntu, Debian, etc.).
4. The `.gitattributes` file in this repo forces LF line endings for scripts and config files, so they work inside Linux containers without manual conversion.

If `docker compose` is not found, use the legacy `docker-compose` plugin or install the Docker Compose CLI plugin in WSL.

### Services

| Service | URL | Notes |
|---------|-----|-------|
| Sennara API | http://localhost/api/v1 | Behind Nginx |
| MinIO Console | http://localhost:9001 | Object storage admin |
| Prometheus | http://localhost:9090 | Metrics |
| Grafana | http://localhost:3000 | Dashboards (admin/admin) |

### Horizontal Scaling

The API containers are stateless. To handle more load on a single machine:

```bash
docker compose up -d --scale api=5 --scale worker=2
```

Nginx automatically load-balances across all running API replicas.

### Development Mode

`docker-compose.override.yml` mounts source code and runs `tsx watch` for hot reload:

```bash
docker compose up -d api worker postgres redis minio
```

### Backups

Run a one-off database backup:

```bash
docker compose --profile backup run --rm backup
```

Or start the backup service for daily backups:

```bash
docker compose --profile backup up -d backup
```

Backups are stored in the `sennara_backups` Docker volume.

### Production Checklist

- [ ] Change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to long random strings
- [ ] Change MinIO `MINIO_ROOT_PASSWORD`
- [ ] Change Grafana `GF_SECURITY_ADMIN_PASSWORD`
- [ ] Add TLS/HTTPS (Let’s Encrypt or self-signed cert in Nginx)
- [ ] Restrict host ports: only Nginx (80/443) should be exposed externally
- [ ] Configure payment provider credentials
- [ ] Configure SMS provider credentials
- [ ] Tune `DB_POOL_MAX` based on PostgreSQL `max_connections`
- [ ] Set up off-site backup replication

## Testing

Backend tests use Jest, Supertest, a dedicated test PostgreSQL database, and `ioredis-mock`.

### Setup test database

```bash
createdb sennara_test
psql sennara_test -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql sennara_test -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### Run tests

```bash
cd backend
npm install
npm test
```

### Test coverage

```bash
cd backend
npm test -- --coverage
```

### Test structure

```
backend/tests/
├── auth/           # OTP, JWT, social login integration tests
├── catches/        # Catch CRUD + privacy location tests
├── feed/           # Likes, comments, shares, friendships
├── payments/       # Gateway abstraction + webhook tests
├── species/        # Species search + detail tests
├── weather/        # Adapter + caching tests
└── utils/          # Test DB, mock Redis, auth helpers, app factory
```

## Localization

- Default locale is **Egyptian Arabic (`ar`)** with full RTL layout.
- Source-of-truth files: `mobile/assets/lang/ar.json` and `mobile/assets/lang/en.json`.
- Backend i18n helper reads from the same JSON files.

## Premium vs Free

| Feature | Free | Premium |
|---------|------|---------|
| Log catches & basic feed | ✅ | ✅ |
| Exact catch coordinates visible on map | Approximate only | ✅ |
| 7-day marine forecast | 24h | ✅ |
| Offline sync | ✅ (queued) | ✅ queued |
| Advanced species stats | ❌ | ✅ |

## License

Private / proprietary — Sennara.
