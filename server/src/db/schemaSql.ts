export const SCHEMA_SQL = `
-- BIIN Judge Portal PostgreSQL Schema (Simplified)

-- 1. Users Table (No room_number)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'judge',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table (Focused on Solution Name, Overview, Problem Statement, Solution Summary, Team Lead)
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    solution_name VARCHAR(500),
    project_overview TEXT,
    problem_statement TEXT,
    solution_summary TEXT,
    team_lead_name VARCHAR(255),
    title VARCHAR(500),
    description TEXT,
    application_type VARCHAR(100) DEFAULT 'Student',
    head_category VARCHAR(50),
    application_id VARCHAR(100),
    project_code VARCHAR(100),
    team_or_org_name VARCHAR(255),
    representative_name VARCHAR(255),
    members JSONB DEFAULT '[]'::jsonb,
    email VARCHAR(255),
    contact_number VARCHAR(100),
    institution_or_org VARCHAR(255),
    tags JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Evaluations Table (No room_number, unconstrained project_id)
CREATE TABLE IF NOT EXISTS evaluations (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    judge_email VARCHAR(255) NOT NULL,
    judge_name VARCHAR(255) NOT NULL,
    scores JSONB NOT NULL,
    feedback TEXT,
    raw_total_score NUMERIC(6, 2) NOT NULL,
    max_raw_score NUMERIC(6, 2) NOT NULL,
    converted_score NUMERIC(6, 2) NOT NULL,
    total_score NUMERIC(6, 2) NOT NULL,
    percentage NUMERIC(6, 2) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT unique_project_judge UNIQUE (project_id, judge_email)
);

-- 4. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'global',
    evaluations_locked BOOLEAN DEFAULT FALSE,
    final_results_locked BOOLEAN DEFAULT FALSE,
    locked_projects JSONB DEFAULT '[]'::jsonb,
    auto_ranking_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_email VARCHAR(255) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Judge Assignments Table
CREATE TABLE IF NOT EXISTS judge_assignments (
    id VARCHAR(64) PRIMARY KEY,
    judge_id VARCHAR(64) NOT NULL,
    judge_email VARCHAR(255) NOT NULL,
    judge_name VARCHAR(255) NOT NULL,
    application_type VARCHAR(100) NOT NULL,
    head_category VARCHAR(50),
    project_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_project ON evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_judge ON evaluations(judge_email);
CREATE INDEX IF NOT EXISTS idx_assignments_judge_email ON judge_assignments(judge_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
`;
