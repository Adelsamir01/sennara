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

## Run on a new Windows + WSL2 machine

### 1. Prerequisites

- Windows 10/11 with WSL2 installed and a Linux distro (Ubuntu is recommended).
- Docker Desktop installed and configured to use the **WSL2 backend** for your distro.
- Git installed inside WSL (`sudo apt update && sudo apt install git`).
- (Optional) Flutter installed inside WSL or Windows if you want to run the mobile app.

### 2. Clone the repo

Always clone inside the WSL filesystem (`/home/<user>`) instead of `/mnt/c/...`; Docker bind mounts are much faster there.

```bash
cd ~
git clone https://github.com/Adelsamir01/sennara.git
cd sennara
```

### 3. Set environment variables

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and at least set:
#   JWT_ACCESS_SECRET=<long random string>
#   JWT_REFRESH_SECRET=<another long random string>
```

`docker-compose.yml` automatically loads `backend/.env` for the API container.

### 4. Start the full stack

```bash
# Build images and start services
docker compose up -d

# Run database migrations and seed species
docker compose --profile migrate run --rm migrate

# Create the MinIO bucket used for photo/video uploads
docker compose --profile setup run --rm createbuckets
```

Wait ~30 seconds for Postgres and Redis health checks, then verify:

```bash
curl http://localhost/health
curl http://localhost/api/v1/species
```

You should see a JSON response from each.

### 5. Available services on the new machine

| Service | URL | Notes |
|---------|-----|-------|
| Sennara API | http://localhost/api/v1 | Behind Nginx |
| Health check | http://localhost/health | Quick liveness probe |
| MinIO Console | http://localhost:9001 | Object storage admin (`minioadmin` / `minioadmin`) |
| Prometheus | http://localhost:9090 | Metrics |
| Grafana | http://localhost:3000 | Dashboards (`admin` / `admin`) |

### 6. Run backend tests (optional)

```bash
cd backend
npm install
npm test
```

### 7. Run the mobile / web app (optional)

```bash
cd mobile
flutter pub get
flutter run -d chrome       # web preview
# or
flutter run -d android      # connected Android device / emulator
# or
flutter run -d ios          # macOS + Xcode only
```

Native plugins (camera, GPS, maps) do not work in the browser; use an Android/iOS device for full functionality.

### 8. Stop everything

```bash
docker compose down
```

To also remove named volumes (databases, MinIO data, backups):

```bash
docker compose down -v
```

### Troubleshooting

| Problem | Cause / Fix |
|---------|-------------|
| `bind: address already in use` for port 80 | Another service is using port 80. Stop it or edit `docker-compose.yml` and map a different host port. |
| `JWT_ACCESS_SECRET` is empty | Make sure `backend/.env` exists and the values are set; the API service loads this file automatically. |
| `docker compose` not found | Install the Docker Compose CLI plugin in WSL, or use the legacy `docker-compose` command. |
| Postgres fails to start | Ensure no other Postgres is running on port 5432, or stop the `docker-compose.override.yml` dev profile. |
| Shell scripts fail with `\r` errors | The `.gitattributes` file forces LF line endings. Re-clone or run `git add --renormalize .` then `git checkout .`. |

### Production mode vs development mode

`docker-compose.override.yml` is loaded automatically and mounts source code with `tsx watch` for hot reload. For a real production deployment, remove or rename that file first:

```bash
mv docker-compose.override.yml docker-compose.override.yml.dev
docker compose -f docker-compose.yml up -d
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
