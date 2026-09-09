-- BIIN Judge Portal PostgreSQL Schema

-- 1. Users Table (Judges and Admin)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'judge',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    room_number VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    room_number VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    capacity INT DEFAULT 10,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    application_id VARCHAR(100) UNIQUE NOT NULL,
    project_code VARCHAR(100),
    application_type VARCHAR(100) NOT NULL,
    head_category VARCHAR(50) NOT NULL,
    team_or_org_name VARCHAR(255) NOT NULL,
    representative_name VARCHAR(255) NOT NULL,
    members JSONB DEFAULT '[]'::jsonb,
    email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(100) NOT NULL,
    institution_or_org VARCHAR(255),
    description TEXT NOT NULL,
    problem_statement TEXT,
    solution_summary TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    room_number VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    judge_email VARCHAR(255) NOT NULL,
    judge_name VARCHAR(255) NOT NULL,
    scores JSONB NOT NULL,
    feedback TEXT,
    raw_total_score NUMERIC(6, 2) NOT NULL,
    max_raw_score NUMERIC(6, 2) NOT NULL,
    converted_score NUMERIC(6, 2) NOT NULL,
    room_number VARCHAR(64),
    total_score NUMERIC(6, 2) NOT NULL,
    percentage NUMERIC(6, 2) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT unique_project_judge UNIQUE (project_id, judge_email)
);

-- 5. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'global',
    evaluations_locked BOOLEAN DEFAULT FALSE,
    final_results_locked BOOLEAN DEFAULT FALSE,
    locked_projects JSONB DEFAULT '[]'::jsonb,
    auto_ranking_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_email VARCHAR(255) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_app_type ON projects(application_type);
CREATE INDEX IF NOT EXISTS idx_projects_head_cat ON projects(head_category);
CREATE INDEX IF NOT EXISTS idx_evaluations_project ON evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_judge ON evaluations(judge_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
