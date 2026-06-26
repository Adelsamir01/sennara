-- Sennara (الصياد) — Initial PostgreSQL + PostGIS Migration
-- Target: PostgreSQL 15+ with PostGIS 3.4+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

--------------------------------------------------------------------------------
-- 1. ENUMERATIONS
--------------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_provider') THEN
        CREATE TYPE auth_provider AS ENUM ('phone_otp', 'google', 'apple');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_level') THEN
        CREATE TYPE privacy_level AS ENUM ('public', 'friends_only', 'secret');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waypoint_type') THEN
        CREATE TYPE waypoint_type AS ENUM (
            'catch_spot',
            'dock',
            'marina',
            'reef',
            'wreck',
            'river_bank',
            'lake_shore',
            'custom'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friendship_status') THEN
        CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('image', 'video');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_provider') THEN
        CREATE TYPE payment_provider AS ENUM (
            'paymob',
            'paytabs',
            'instapay',
            'vodafone_cash',
            'fawry',
            'stripe'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'water_body') THEN
        CREATE TYPE water_body AS ENUM (
            'mediterranean_sea',
            'red_sea',
            'gulf_of_suez',
            'gulf_of_aqaba',
            'nile_river',
            'lake_nasser',
            'lake_qarun',
            'manzala_lagoon',
            'burullus_lagoon'
        );
    END IF;
END$$;

--------------------------------------------------------------------------------
-- 2. USERS
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(120),
    handle VARCHAR(60) UNIQUE,
    avatar_url TEXT,
    locale VARCHAR(5) NOT NULL DEFAULT 'ar',
    auth_provider auth_provider NOT NULL DEFAULT 'phone_otp',
    auth_provider_id VARCHAR(255),
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    default_privacy privacy_level NOT NULL DEFAULT 'friends_only',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_handle_format CHECK (handle ~ '^[a-zA-Z0-9_.]{3,60}$')
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);

--------------------------------------------------------------------------------
-- 3. FISH SPECIES TAXONOMY
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS species (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scientific_name VARCHAR(255) NOT NULL,
    english_name VARCHAR(255),
    arabic_name VARCHAR(255),
    egyptian_slang_names TEXT[] NOT NULL DEFAULT '{}',
    family VARCHAR(120),
    category VARCHAR(50), -- e.g. 'demersal', 'pelagic', 'freshwater'
    water_bodies TEXT[] NOT NULL DEFAULT '{}',
    description TEXT,
    habitat TEXT,
    average_weight_kg DECIMAL(8, 3),
    image_url TEXT,
    is_edible BOOLEAN DEFAULT TRUE,
    conservation_status VARCHAR(50) DEFAULT 'least_concern',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT species_unique_scientific UNIQUE (scientific_name)
);

CREATE INDEX IF NOT EXISTS idx_species_slang ON species USING GIN (egyptian_slang_names);
CREATE INDEX IF NOT EXISTS idx_species_water_bodies ON species USING GIN (water_bodies);

--------------------------------------------------------------------------------
-- 4. WAYPOINTS (PostGIS)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT,
    coordinates GEOGRAPHY(Point, 4326) NOT NULL,
    privacy privacy_level NOT NULL DEFAULT 'secret',
    waypoint_type waypoint_type NOT NULL DEFAULT 'catch_spot',
    water_body water_body,
    depth_meters DECIMAL(6, 2),
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial indexes for fast nearest-neighbor & bounding-box queries
CREATE INDEX IF NOT EXISTS idx_waypoints_coords ON waypoints USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_waypoints_user ON waypoints(user_id);
CREATE INDEX IF NOT EXISTS idx_waypoints_privacy ON waypoints(privacy);
CREATE INDEX IF NOT EXISTS idx_waypoints_water_body ON waypoints(water_body);

--------------------------------------------------------------------------------
-- 5. CATCHES (Social Catch Feed & Logbook)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS catches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    species_id UUID REFERENCES species(id) ON DELETE SET NULL,
    waypoint_id UUID REFERENCES waypoints(id) ON DELETE SET NULL,
    weight_kg DECIMAL(8, 3),
    length_cm DECIMAL(6, 2),
    bait_type VARCHAR(120),
    lure_type VARCHAR(120),
    technique VARCHAR(120),
    description TEXT,
    photo_urls TEXT[] NOT NULL DEFAULT '{}',
    video_urls TEXT[] NOT NULL DEFAULT '{}',
    privacy privacy_level NOT NULL DEFAULT 'friends_only',
    exact_location GEOGRAPHY(Point, 4326),
    -- Captured weather/marine data at the time of the catch
    weather JSONB NOT NULL DEFAULT '{}',
    catch_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT catches_weight_positive CHECK (weight_kg IS NULL OR weight_kg > 0),
    CONSTRAINT catches_length_positive CHECK (length_cm IS NULL OR length_cm > 0)
);

CREATE INDEX IF NOT EXISTS idx_catches_user ON catches(user_id);
CREATE INDEX IF NOT EXISTS idx_catches_species ON catches(species_id);
CREATE INDEX IF NOT EXISTS idx_catches_waypoint ON catches(waypoint_id);
CREATE INDEX IF NOT EXISTS idx_catches_privacy ON catches(privacy);
CREATE INDEX IF NOT EXISTS idx_catches_catch_date ON catches(catch_date DESC);
CREATE INDEX IF NOT EXISTS idx_catches_location ON catches USING GIST (exact_location);
CREATE INDEX IF NOT EXISTS idx_catches_weather ON catches USING GIN (weather);

--------------------------------------------------------------------------------
-- 6. SOCIAL INTERACTIONS
--------------------------------------------------------------------------------

-- Likes / "Ta7ya" (تحية)
CREATE TABLE IF NOT EXISTS catch_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT catch_likes_unique UNIQUE (catch_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_catch_likes_catch ON catch_likes(catch_id);
CREATE INDEX IF NOT EXISTS idx_catch_likes_user ON catch_likes(user_id);

-- Comments
CREATE TABLE IF NOT EXISTS catch_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES catch_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catch_comments_catch ON catch_comments(catch_id);
CREATE INDEX IF NOT EXISTS idx_catch_comments_user ON catch_comments(user_id);

-- Shares (denormalized counter + audit trail)
CREATE TABLE IF NOT EXISTS catch_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50), -- 'in_app', 'whatsapp', 'facebook', etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catch_shares_catch ON catch_shares(catch_id);

--------------------------------------------------------------------------------
-- 7. FRIENDSHIPS
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friendship_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT friendships_no_self CHECK (requester_id <> addressee_id),
    CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

--------------------------------------------------------------------------------
-- 8. WEATHER & MARINE CACHE
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS weather_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    water_body water_body,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(60) NOT NULL,
    source_request_id VARCHAR(255),
    -- Raw + normalized payload
    payload JSONB NOT NULL,
    wind_speed_kmh DECIMAL(6, 2),
    wind_direction_deg INT,
    wave_height_m DECIMAL(5, 2),
    swell_direction_deg INT,
    barometric_pressure_hpa DECIMAL(7, 2),
    air_temperature_c DECIMAL(5, 2),
    water_temperature_c DECIMAL(5, 2),
    tidal_state VARCHAR(20),
    visibility_km DECIMAL(5, 2),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_location ON weather_snapshots USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_weather_expires ON weather_snapshots(expires_at);
CREATE INDEX IF NOT EXISTS idx_weather_fetched_at ON weather_snapshots(fetched_at DESC);

--------------------------------------------------------------------------------
-- 9. PAYMENTS & SUBSCRIPTIONS
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider payment_provider NOT NULL,
    provider_transaction_id VARCHAR(255),
    provider_order_id VARCHAR(255),
    amount_egp DECIMAL(10, 2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    subscription_tier subscription_tier,
    subscription_months INT,
    metadata JSONB NOT NULL DEFAULT '{}',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_txn ON payments(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

--------------------------------------------------------------------------------
-- 10. OTP AUDIT
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    gateway VARCHAR(50) NOT NULL DEFAULT 'smsmisr',
    attempts INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

--------------------------------------------------------------------------------
-- 11. OFFLINE SYNC QUEUE
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_uuid VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'catch', 'waypoint', 'comment'
    payload JSONB NOT NULL,
    media_urls TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    retry_count INT NOT NULL DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT offline_sync_unique_client UNIQUE (client_uuid)
);

CREATE INDEX IF NOT EXISTS idx_offline_sync_user ON offline_sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_status ON offline_sync_queue(status);

--------------------------------------------------------------------------------
-- 12. AUDIT & SOFT-DELETE TRIGGERS
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users', 'species', 'waypoints', 'catches',
                             'catch_comments', 'friendships', 'payments',
                             'offline_sync_queue']
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'trg_' || t || '_updated_at'
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER trg_%I_updated_at
                 BEFORE UPDATE ON %I
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
                t, t
            );
        END IF;
    END LOOP;
END$$;

--------------------------------------------------------------------------------
-- 13. MATERIALIZED VIEW: PUBLIC CATCH HEATMAP
--------------------------------------------------------------------------------

CREATE MATERIALIZED VIEW IF NOT EXISTS public_catch_heatmap AS
SELECT
    c.species_id,
    w.water_body,
    ST_SnapToGrid(c.exact_location::geometry, 0.01) AS grid_cell, -- ~1.1km grid
    COUNT(*) AS catch_count,
    MAX(c.catch_date) AS last_catch_at
FROM catches c
LEFT JOIN waypoints w ON c.waypoint_id = w.id
WHERE c.privacy = 'public'
  AND c.exact_location IS NOT NULL
GROUP BY c.species_id, w.water_body, ST_SnapToGrid(c.exact_location::geometry, 0.01);

CREATE INDEX IF NOT EXISTS idx_heatmap_grid ON public_catch_heatmap USING GIST (grid_cell);

--------------------------------------------------------------------------------
-- 14. PRIVACY-AWARE VIEW: CATCHES VISIBLE TO A USER
--------------------------------------------------------------------------------

-- This view returns rows visible to a given user.
-- It is intended to be queried with a direct user_id parameter or wrapped
-- by application-layer repository code that injects the current user.
CREATE OR REPLACE FUNCTION catches_visible_to(viewer_id UUID)
RETURNS TABLE (
    catch_id UUID,
    owner_id UUID,
    privacy privacy_level,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS catch_id,
        c.user_id AS owner_id,
        c.privacy,
        NULL::DOUBLE PRECISION AS distance_km
    FROM catches c
    WHERE c.privacy = 'public'
       OR c.user_id = viewer_id
       OR (
           c.privacy = 'friends_only'
           AND EXISTS (
               SELECT 1 FROM friendships f
               WHERE f.status = 'accepted'
                 AND (
                     (f.requester_id = viewer_id AND f.addressee_id = c.user_id)
                     OR (f.addressee_id = viewer_id AND f.requester_id = c.user_id)
                 )
           )
       );
END;
$$ LANGUAGE plpgsql STABLE;
