# Sennara — Egyptian Fishing Community

A cross-platform mobile application and scalable backend for Egyptian anglers, inspired by Fishbrain but rebuilt for local waters, local species, local payment methods, and Egyptian Arabic first.

## Current public demo

The stack is currently exposed through a free **Cloudflare Quick Tunnel**. The URL changes when the tunnel container restarts; check it with:

```bash
docker logs sennara-cf | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com'
```

- Sign in with your phone number to receive a WhatsApp OTP.
- Use **“+ صيد جديد”** to add a catch with a fish photo and GPS location.

> Quick Tunnel URLs are temporary. For a stable domain you need a Cloudflare account plus your own domain.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Mobile | **Flutter 3.x** | First-class RTL/Arabic support, single codebase for iOS & Android, excellent map plugins, offline SQLite via Drift |
| Backend | **Node.js + Express + TypeScript** | Mature ecosystem, easy REST coexistence, strong typing |
| Database | **PostgreSQL 15+ + PostGIS 3.4+** | Geospatial queries, relational social graph, JSONB for flexible weather/metadata |
| Cache | **Redis** | Feed caching, weather TTL, OTP rate limiting, offline queue lock |
| Search | **PostgreSQL full-text + trigram** | Species/local-name search without extra infra at early stage |
| Maps | **Mapbox** | Offline tile packs, marine style layers |
| Auth | **Phone OTP** (WhatsApp Cloud API + Twilio fallback) + Google/Apple Sign-In | Mobile-first Egypt identity, no SMSMISR dependency |
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
- `POST /auth/otp/request` — send WhatsApp OTP (Twilio SMS fallback)
- `POST /auth/otp/verify` — verify OTP and receive JWT pair
- `POST /auth/social` — Google/Apple sign-in
- `POST /auth/refresh` — rotate refresh token
- `POST /auth/logout` — revoke current access & refresh tokens
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
`backend/.env` is already in `.gitignore` — **never commit it**.

You will also need to set:
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — long random strings
- `OTP_SECRET` — long random string for hashing OTP codes (`openssl rand -hex 32`)
- `WHATSAPP_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` — for WhatsApp OTP (see WhatsApp setup below)
- `S3_PUBLIC_ENDPOINT` — public URL for uploads (e.g. your Cloudflare tunnel URL)

### 4. Start the full stack in production mode

```bash
# Disable the development override (hot reload / exposed DB ports)
mv docker-compose.override.yml docker-compose.override.yml.dev

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
| Sennara dashboard | http://localhost/ | Static dashboard served by Nginx |
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

### 8. Expose the stack publicly

The project is configured for the stable domain **`https://sennara.adelsamir.com`** via a named Cloudflare Tunnel.

1. Make sure `adelsamir.com` is active on Cloudflare and create a tunnel:

   ```bash
   cloudflared tunnel create sennara
   cloudflared tunnel route dns sennara sennara.adelsamir.com
   ```

2. Get the tunnel token:

   ```bash
   cloudflared tunnel token sennara
   ```

3. Paste the token into `backend/.env`:

   ```bash
   CLOUDFLARE_TUNNEL_TOKEN=<your-token>
   ```

4. `S3_PUBLIC_ENDPOINT` in `backend/.env` should already be:

   ```bash
   S3_PUBLIC_ENDPOINT=https://sennara.adelsamir.com
   ```

5. Start the tunnel container:

   ```bash
   docker compose up -d cloudflared
   ```

6. Open `https://sennara.adelsamir.com`.

If you do not have a Cloudflare account yet, you can use a free Cloudflare Quick Tunnel temporarily (the URL changes on restart):

```bash
docker run -d --name sennara-cf --network sennara_sennara-network \
  --restart unless-stopped cloudflare/cloudflared:latest \
  tunnel --url http://nginx:80
```

### WhatsApp OTP setup

1. Go to [Meta for Developers](https://developers.facebook.com/) and create an app with the **WhatsApp** product.
2. Add a WhatsApp Business phone number and copy the **Phone Number ID**.
3. Create an **Authentication** or **Utility** message template with one body parameter for the OTP code, e.g.:
   ```
   رمز التحقق الخاص بك هو: {{1}}
   Your verification code is: {{1}}
   ```
   Name it `sennara_otp` (or set `WHATSAPP_OTP_TEMPLATE_NAME`).
4. Generate a permanent access token and set:
   - `WHATSAPP_API_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_OTP_TEMPLATE_NAME=sennara_otp`
   - `WHATSAPP_OTP_LANGUAGE=ar`
5. Until Meta approves your template, keep `TWILIO_*` credentials configured as an SMS fallback.

### WhatsApp webhooks setup

1. In your Meta app dashboard, go to **WhatsApp > Configuration** and click **Edit** in the **Webhooks** section.
2. Set the **Callback URL** to your public HTTPS URL, e.g.:
   ```
   https://your-domain.com/webhooks/whatsapp
   ```
3. Set a **Verify token**: any random string you choose, and save it in `backend/.env` as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
4. Click **Verify and save**. Meta will send a GET request to the callback URL; the API will respond with the challenge only if the verify token matches.
5. After subscribing, click **Manage webhook fields** and subscribe to:
   - `messages` — incoming WhatsApp messages (useful for opt-in/opt-out)
   - `message_status` — delivery/read/failed status updates for your OTP messages
6. (Recommended) Copy the **App Secret** from the app dashboard and set `WHATSAPP_APP_SECRET` in `backend/.env`. The API will then validate `X-Hub-Signature-256` on every inbound webhook.

### 9. Stop everything

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
# Edit backend/.env — at minimum set:
#   JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, OTP_SECRET
#   WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, S3_PUBLIC_ENDPOINT

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

- [ ] Change `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `OTP_SECRET` to long random strings
- [ ] Configure WhatsApp Cloud API credentials and approve your OTP template
- [ ] Set `S3_PUBLIC_ENDPOINT` to your public domain
- [ ] Set `METRICS_BASIC_AUTH_PASSWORD` to protect `/metrics`
- [ ] Change MinIO `MINIO_ROOT_PASSWORD`
- [ ] Change Grafana `GF_SECURITY_ADMIN_PASSWORD`
- [ ] Add TLS/HTTPS (Let’s Encrypt or self-signed cert in Nginx)
- [ ] Restrict host ports: only Nginx (80/443) should be exposed externally
- [ ] Configure payment provider credentials
- [ ] Configure Twilio credentials as an SMS fallback (optional)
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
