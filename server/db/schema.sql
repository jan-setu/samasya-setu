-- SamasyaSetu Schema (PostgreSQL compatible, compatible with SQLite)

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('university', 'startup', 'industry', 'msme', 'csr', 'research_lab', 'govt_dept')),
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    expertise_tags TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
    expertise_embedding TEXT,                  -- JSON array of floats
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('citizen', 'admin', 'govt_dept', 'faculty', 'student', 'industry')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    org_id TEXT REFERENCES organizations(id),
    department TEXT,                           -- For faculty/student
    is_verified INTEGER NOT NULL DEFAULT 1,    -- 0 for unverified admin/govt_dept, 1 for verified/others
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problem_clusters (
    id TEXT PRIMARY KEY,
    canonical_problem_id TEXT,
    report_count INTEGER NOT NULL DEFAULT 1,
    centroid_lat REAL NOT NULL,
    centroid_lng REAL NOT NULL,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    raw_description TEXT NOT NULL,
    description_en TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    district TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    subcategory TEXT,
    affected_scope TEXT,
    safety_risk INTEGER DEFAULT 0,
    infrastructure_type TEXT,
    priority_score INTEGER NOT NULL DEFAULT 10,
    priority_band TEXT NOT NULL DEFAULT 'Low' CHECK(priority_band IN ('Low', 'Medium', 'High', 'Critical')),
    priority_breakdown TEXT NOT NULL DEFAULT '{}', -- JSON object with score breakdown
    status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('processing', 'pending_verification', 'published', 'claimed', 'in_development', 'deployed', 'impact_verified', 'rejected', 'merged', 'abandoned')),
    cluster_id TEXT REFERENCES problem_clusters(id),
    embedding TEXT,                              -- JSON array of floats
    matched_org_ids TEXT DEFAULT '[]',           -- JSON array of org ids
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problem_media (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('photo', 'video', 'document')),
    caption TEXT,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS confirmations (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(problem_id, user_id)
);

CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    admin_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL CHECK(action IN ('approve', 'reject', 'merge')),
    reason TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    faculty_lead_id TEXT REFERENCES users(id),
    member_ids TEXT NOT NULL DEFAULT '[]', -- JSON array of user IDs
    department TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    org_id TEXT NOT NULL REFERENCES organizations(id),
    team_id TEXT REFERENCES teams(id),
    submitted_by TEXT NOT NULL REFERENCES users(id),
    approach TEXT NOT NULL,
    tech_stack TEXT NOT NULL,
    budget REAL NOT NULL DEFAULT 0,
    timeline_weeks INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'shortlisted', 'accepted', 'rejected', 'completed')),
    funding_requested REAL DEFAULT 0,
    funding_pledged REAL DEFAULT 0,
    pledged_by_org_id TEXT REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
    evidence_url TEXT,
    notes TEXT,
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS impact_reports (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    beneficiaries_count INTEGER NOT NULL DEFAULT 0,
    patents_filed INTEGER NOT NULL DEFAULT 0,
    startups_created INTEGER NOT NULL DEFAULT 0,
    metrics_json TEXT NOT NULL DEFAULT '{}', -- JSON object
    summary TEXT,
    verified_by_admin INTEGER NOT NULL DEFAULT 0,
    verified_by_admin_id TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_problem_id TEXT,
    related_proposal_id TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
