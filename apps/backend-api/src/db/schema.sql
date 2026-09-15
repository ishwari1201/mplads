-- PostGIS and Spatial Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('MP_MLA', 'DISTRICT_AUTHORITY', 'IMPLEMENTING_AGENCY', 'NODAL_OFFICER', 'CITIZEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('RECOMMENDED', 'IN_FEASIBILITY', 'SANCTIONED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'FROZEN_PENDING_AUDIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE category_type AS ENUM ('SC', 'ST', 'GENERAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 0. Geography & Sector Master Tables
CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    state_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS constituencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    state_id INT REFERENCES states(id) ON DELETE CASCADE,
    house_type VARCHAR(50) DEFAULT 'LOK_SABHA'
);

CREATE TABLE IF NOT EXISTS district_authorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    district_name VARCHAR(150) NOT NULL,
    state_id INT REFERENCES states(id) ON DELETE RESTRICT,
    collector_name VARCHAR(150),
    office_address TEXT
);

CREATE TABLE IF NOT EXISTS implementing_agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    agency_name VARCHAR(200) NOT NULL,
    agency_type VARCHAR(100) DEFAULT 'GOVERNMENT_DEPT',
    registration_no VARCHAR(100),
    district_id UUID REFERENCES district_authorities(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS work_sectors (
    id SERIAL PRIMARY KEY,
    sector_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_priority BOOLEAN DEFAULT FALSE
);

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CITIZEN',
    phone_number VARCHAR(20),
    constituency_id INT REFERENCES constituencies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. MPs Table (Member of Parliament / Assembly)
CREATE TABLE IF NOT EXISTS mps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    party VARCHAR(100) NOT NULL,
    constituency_name VARCHAR(150) NOT NULL,
    total_allocation NUMERIC(15, 2) DEFAULT 50000000.00 NOT NULL, -- ₹5 Crore per annum
    sc_reserved_spent NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,     -- 15% statutory SC allocation
    st_reserved_spent NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,     -- 7.5% statutory ST allocation
    general_spent NUMERIC(15, 2) DEFAULT 0.00 NOT NULL
);

-- 3. Projects / Works Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    sector VARCHAR(100) NOT NULL,
    category category_type NOT NULL DEFAULT 'GENERAL',
    estimated_cost NUMERIC(15, 2) NOT NULL CHECK (estimated_cost > 0),
    sanctioned_amount NUMERIC(15, 2) CHECK (sanctioned_amount >= 0),
    status project_status NOT NULL DEFAULT 'RECOMMENDED',
    mp_id UUID NOT NULL REFERENCES mps(id) ON DELETE RESTRICT,
    da_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ia_id UUID REFERENCES users(id) ON DELETE SET NULL,
    state_id INT REFERENCES states(id) ON DELETE SET NULL,
    district_id UUID REFERENCES district_authorities(id) ON DELETE SET NULL,
    constituency_id INT REFERENCES constituencies(id) ON DELETE SET NULL,
    location GEOMETRY(Point, 4326),
    address TEXT NOT NULL,
    sla_deadline TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '75 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Backward compatibility view so queries for `works` map cleanly to `projects`
CREATE OR REPLACE VIEW works AS
SELECT 
    id,
    title,
    description,
    sector,
    category,
    estimated_cost,
    sanctioned_amount,
    status,
    mp_id,
    da_id,
    ia_id,
    state_id,
    district_id,
    constituency_id,
    location,
    ST_Y(location::geometry) AS latitude,
    ST_X(location::geometry) AS longitude,
    address,
    sla_deadline,
    created_at
FROM projects;

-- 4. Audit Logs Table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_taken VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    previous_state JSONB,
    new_state JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Performance & Geospatial Indexing
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_mp_id ON projects(mp_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_state_id ON projects(state_id);
CREATE INDEX IF NOT EXISTS idx_projects_district_id ON projects(district_id);
CREATE INDEX IF NOT EXISTS idx_projects_constituency_id ON projects(constituency_id);
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Enforce Immutability on Audit Trail (Prevent UPDATE or DELETE on audit_logs)
CREATE OR REPLACE FUNCTION enforce_audit_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'TAMPER ERROR: Operation % is prohibited on immutable audit logs.', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_tampering ON audit_logs;
CREATE TRIGGER trg_prevent_audit_tampering
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutability();

-- Citizen Reports & Ground Signals Table
CREATE TABLE IF NOT EXISTS citizen_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    reporter_name VARCHAR(255),
    reporter_email VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    sha256_hash VARCHAR(64),
    phash_hash VARCHAR(64),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    location_point GEOMETRY(Point, 4326),
    gps_accuracy NUMERIC(10, 2),
    gps_source VARCHAR(50) DEFAULT 'GPS_UNAVAILABLE',
    exif_latitude NUMERIC(10, 7),
    exif_longitude NUMERIC(10, 7),
    exif_location_point GEOMETRY(Point, 4326),
    exif_timestamp TIMESTAMPTZ,
    distance_from_work_meters NUMERIC(10, 2),
    proximity_classification VARCHAR(50) NOT NULL DEFAULT 'GPS_UNAVAILABLE',
    photo_gps_corroboration VARCHAR(50) DEFAULT 'PHOTO_GPS_UNAVAILABLE',
    photo_timestamp_status VARCHAR(50) DEFAULT 'PHOTO_TIMESTAMP_UNAVAILABLE',
    duplicate_status VARCHAR(50) DEFAULT 'NORMAL',
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- 5. Evidence Requests & Responses Table
CREATE TABLE IF NOT EXISTS evidence_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    evidence_type VARCHAR(150) NOT NULL,
    reason TEXT NOT NULL,
    instructions TEXT,
    deadline TIMESTAMPTZ,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    submitted_photo_url TEXT,
    response_notes TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Cases & Escalation Workflow Table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    risk_score NUMERIC(5, 2) DEFAULT 0.00,
    risk_level VARCHAR(20) DEFAULT 'MEDIUM',
    trigger_reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    escalated_from VARCHAR(50),
    escalated_to VARCHAR(50),
    review_notes TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Case Action History (Immutable Log for Cases)
CREATE TABLE IF NOT EXISTS case_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    action_by UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Satellite Observations Table
CREATE TABLE IF NOT EXISTS satellite_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source VARCHAR(150) NOT NULL DEFAULT 'Bhuvan ISRO WMS/WMTS',
    acquisition_date TIMESTAMPTZ NOT NULL,
    before_image_url TEXT,
    after_image_url TEXT,
    change_score NUMERIC(5, 2),
    change_class VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Government Cross-Checks Table (OGD / JanSoochna / ETS)
CREATE TABLE IF NOT EXISTS government_cross_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    source VARCHAR(150) NOT NULL,
    dataset_id VARCHAR(100),
    external_record_id VARCHAR(100),
    match_type VARCHAR(100) NOT NULL,
    match_score NUMERIC(5, 2),
    provenance_details JSONB,
    checked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Contractors & Network Collusion Table
CREATE TABLE IF NOT EXISTS contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    registration_no VARCHAR(100) UNIQUE,
    address TEXT,
    phone VARCHAR(50),
    contact_person VARCHAR(150),
    pan_gstin VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS work_contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    awarded_amount NUMERIC(15, 2),
    awarded_date DATE
);

CREATE TABLE IF NOT EXISTS contractor_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_a_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    contractor_b_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    confidence_score NUMERIC(5, 2),
    flagged_signal VARCHAR(100) DEFAULT 'COLLUSION_RISK_SIGNAL'
);

-- 11. Historical Progress Updates Table
CREATE TABLE IF NOT EXISTS progress_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    physical_percentage NUMERIC(5, 2) NOT NULL,
    milestone_name VARCHAR(200),
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Site Photographs Table
CREATE TABLE IF NOT EXISTS site_photographs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    sha256_hash VARCHAR(64),
    phash_value VARCHAR(64),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geo_point GEOMETRY(Point, 4326),
    taken_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_flagged_fraud BOOLEAN DEFAULT FALSE,
    fraud_reason TEXT
);

-- Indexes for closed-loop performance
CREATE INDEX IF NOT EXISTS idx_evidence_requests_work ON evidence_requests(work_id);
CREATE INDEX IF NOT EXISTS idx_evidence_requests_status ON evidence_requests(status);
CREATE INDEX IF NOT EXISTS idx_cases_work ON cases(work_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_satellite_obs_work ON satellite_observations(work_id);
CREATE INDEX IF NOT EXISTS idx_gov_checks_work ON government_cross_checks(work_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_rec ON progress_updates(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_site_photos_rec ON site_photographs(recommendation_id);



