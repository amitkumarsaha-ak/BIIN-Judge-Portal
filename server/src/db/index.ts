import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SEED_USERS,
  SEED_ROOMS,
  SEED_PROJECTS,
  SEED_EVALUATIONS,
  SEED_SETTINGS,
  SEED_AUDIT_LOGS,
  SeedUser,
  SeedRoom,
  SeedProject,
  SeedEvaluation,
  SeedAssignment
} from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env reliably regardless of working directory
const serverEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}
dotenv.config();

const { Pool } = pg;

export interface DbStatus {
  type: 'postgres' | 'memory';
  connected: boolean;
  message: string;
}

let isPostgresConnected = false;
let connectionErrorMessage = '';

const isCloudDb = Boolean(process.env.DATABASE_URL);

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        max: 10
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'biin_judge_portal',
        connectionTimeoutMillis: 4000,
        max: 10
      }
);

// In-memory store fallback with local file persistence for development resilience
const FALLBACK_STORE_FILE = path.join(__dirname, '../../.memory_store.json');

interface MemoryStoreState {
  users: SeedUser[];
  rooms: SeedRoom[];
  projects: SeedProject[];
  evaluations: SeedEvaluation[];
  assignments: SeedAssignment[];
  settings: typeof SEED_SETTINGS;
  auditLogs: typeof SEED_AUDIT_LOGS;
}

function loadMemoryFallback(): MemoryStoreState {
  try {
    if (fs.existsSync(FALLBACK_STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FALLBACK_STORE_FILE, 'utf8'));
      return {
        users: (Array.isArray(parsed.users) ? parsed.users : [...SEED_USERS]) as SeedUser[],
        rooms: (Array.isArray(parsed.rooms) ? parsed.rooms : [...SEED_ROOMS]) as SeedRoom[],
        projects: (Array.isArray(parsed.projects) ? parsed.projects : [...SEED_PROJECTS]) as SeedProject[],
        evaluations: (Array.isArray(parsed.evaluations) ? parsed.evaluations : [...SEED_EVALUATIONS]) as SeedEvaluation[],
        assignments: (Array.isArray(parsed.assignments) ? parsed.assignments : []) as SeedAssignment[],
        settings: parsed.settings || { ...SEED_SETTINGS },
        auditLogs: (Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [...SEED_AUDIT_LOGS]) as typeof SEED_AUDIT_LOGS
      };
    }
  } catch {}
  return {
    users: [...SEED_USERS],
    rooms: [...SEED_ROOMS],
    projects: [...SEED_PROJECTS],
    evaluations: [...SEED_EVALUATIONS],
    assignments: [],
    settings: { ...SEED_SETTINGS },
    auditLogs: [...SEED_AUDIT_LOGS]
  };
}

const memoryStore: MemoryStoreState = loadMemoryFallback();

export function saveMemoryFallback(): void {
  try {
    fs.writeFileSync(FALLBACK_STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch {}
}

async function ensureDatabaseExists() {
  if (isCloudDb) {
    // Cloud managed DB already exists
    return;
  }
  const targetDb = process.env.PGDATABASE || 'biin_judge_portal';
  const adminClient = new pg.Client({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: 'postgres',
    connectionTimeoutMillis: 4000
  });

  try {
    await adminClient.connect();
    const checkRes = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDb]
    );
    if (checkRes.rows.length === 0) {
      console.log(`[Database] Database "${targetDb}" does not exist. Creating it now...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`[Database] Database "${targetDb}" created successfully!`);
    }
  } catch (err: any) {
    // Note only if needed
  } finally {
    try {
      await adminClient.end();
    } catch {}
  }
}

/**
 * Initialize PostgreSQL connection and tables
 */
export async function initDatabase(): Promise<DbStatus> {
  try {
    await ensureDatabaseExists();
    const client = await pool.connect();
    try {
      // Test simple query
      await client.query('SELECT NOW()');
      isPostgresConnected = true;

      // Run schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
      }

      // Safe schema migrations for existing databases
      try {
        await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_lead_name VARCHAR(255)');
        await client.query('ALTER TABLE projects ALTER COLUMN head_category DROP NOT NULL');
      } catch (migErr) {
        console.warn('[Database] Migration notice:', migErr);
      }

      // Ensure Admin user exists in PostgreSQL
      for (const u of SEED_USERS) {
        await client.query(
          `INSERT INTO users (id, full_name, email, password, role, status, room_number, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, password = EXCLUDED.password, role = 'admin', status = 'approved'`,
          [u.id, u.fullName, u.email.toLowerCase(), u.password, u.role, u.status, u.roomNumber || null, u.createdAt]
        );
      }

      // Ensure default rooms exist
      for (const r of SEED_ROOMS) {
        await client.query(
          `INSERT INTO rooms (id, room_number, name, location, capacity, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (room_number) DO NOTHING`,
          [r.id, r.roomNumber, r.name, r.location || null, r.capacity || 10, r.description || null, r.createdAt]
        );
      }

      // Ensure default projects exist if table is empty
      const projCountRes = await client.query('SELECT COUNT(*)::int as count FROM projects');
      if ((projCountRes.rows[0]?.count ?? 0) === 0 && Array.isArray(SEED_PROJECTS) && SEED_PROJECTS.length > 0) {
        console.log(`[Database] Seeding ${SEED_PROJECTS.length} starter projects into PostgreSQL...`);
        for (const p of SEED_PROJECTS) {
          await client.query(`
            INSERT INTO projects (
              id, title, application_id, project_code, application_type, head_category,
              team_or_org_name, representative_name, team_lead_name, members, email, contact_number,
              institution_or_org, description, problem_statement, solution_summary,
              tags, room_number, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT (application_id) DO NOTHING
          `, [
            p.id, p.title, p.applicationId, p.projectCode, p.applicationType, p.headCategory || null,
            p.teamOrOrgName, p.representativeName, p.teamLeadName || null, JSON.stringify(p.members || []),
            p.email, p.contactNumber, p.institutionOrOrg || null, p.description,
            p.problemStatement || null, p.solutionSummary || null, JSON.stringify(p.tags || []),
            p.roomNumber || null, p.status || 'active'
          ]);
        }
        console.log('[Database] Starter projects seeded successfully.');
      }

      // Ensure global settings record exists
      await client.query(
        `INSERT INTO system_settings (id, evaluations_locked, final_results_locked, locked_projects, auto_ranking_enabled)
         VALUES ('global', false, false, '[]'::jsonb, true)
         ON CONFLICT (id) DO NOTHING`
      );

      // Seed audit log
      for (const a of SEED_AUDIT_LOGS) {
        await client.query(
          `INSERT INTO audit_logs (id, actor_email, actor_name, action, target_type, details, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [a.id, a.actorEmail || 'admin@biin.org', a.actorName || 'Administrator', a.action, a.targetType, a.details, a.timestamp]
        );
      }
      console.log('[Database] PostgreSQL initialized successfully.');

      console.log('✅ [Database] PostgreSQL connected and ready!');
      return {
        type: 'postgres',
        connected: true,
        message: 'PostgreSQL database connected and schema synchronized.'
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    isPostgresConnected = false;
    connectionErrorMessage = err?.message || String(err);
    console.warn('\n⚠️  [Database] Could not establish connection to PostgreSQL:', connectionErrorMessage);
    console.warn('💡 [Database] Make sure PostgreSQL is running and credentials in "server/.env" match:');
    console.warn(`    PGUSER=${process.env.PGUSER || 'postgres'}`);
    console.warn(`    PGDATABASE=${process.env.PGDATABASE || 'biin_judge_portal'}`);
    console.warn(`    PGPORT=${process.env.PGPORT || '5432'}`);
    console.warn('⚡ [Database] Operating in fast in-memory fallback store with full persistence during runtime.\n');
    return {
      type: 'memory',
      connected: false,
      message: `PostgreSQL connection unavailable (${connectionErrorMessage}). Active in Memory Fallback mode.`
    };
  }
}

export const getDbStatus = (): DbStatus => ({
  type: isPostgresConnected ? 'postgres' : 'memory',
  connected: isPostgresConnected,
  message: isPostgresConnected ? 'Connected to PostgreSQL' : `In-Memory Fallback (${connectionErrorMessage || 'offline'})`
});

// --- USER DATA ACCESS OBJECT ---
export const userDb = {
  async getAll(): Promise<SeedUser[]> {
    if (isPostgresConnected) {
      const res = await pool.query(`
        SELECT id, full_name as "fullName", email, password, role, status,
               room_number as "roomNumber", created_at as "createdAt"
        FROM users ORDER BY created_at ASC
      `);
      return res.rows;
    }
    return [...memoryStore.users];
  },

  async findByEmail(email: string): Promise<SeedUser | undefined> {
    const cleanEmail = email.trim().toLowerCase();
    if (isPostgresConnected) {
      try {
        const res = await pool.query(`
          SELECT id, full_name as "fullName", email, password, role, status,
                 room_number as "roomNumber", created_at as "createdAt"
          FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1
        `, [cleanEmail]);
        if (res.rows[0]) return res.rows[0];
      } catch (err) {
        console.error('[userDb.findByEmail] Postgres query failed:', err);
      }
    }
    return memoryStore.users.find(u => u.email.trim().toLowerCase() === cleanEmail);
  },

  async findById(id: string): Promise<SeedUser | undefined> {
    if (isPostgresConnected) {
      const res = await pool.query(`
        SELECT id, full_name as "fullName", email, password, role, status,
               room_number as "roomNumber", created_at as "createdAt"
        FROM users WHERE id = $1 LIMIT 1
      `, [id]);
      return res.rows[0];
    }
    return memoryStore.users.find(u => u.id === id);
  },

  async create(user: SeedUser): Promise<SeedUser> {
    const cleanEmail = user.email.toLowerCase().trim();
    if (isPostgresConnected) {
      await pool.query(`
        INSERT INTO users (id, full_name, email, password, role, status, room_number, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          password = COALESCE(EXCLUDED.password, users.password),
          status = CASE WHEN users.status = 'approved' THEN 'approved' ELSE EXCLUDED.status END,
          room_number = COALESCE(EXCLUDED.room_number, users.room_number)
      `, [
        user.id, user.fullName, cleanEmail, user.password,
        user.role, user.status, user.roomNumber || null, user.createdAt
      ]);
      return user;
    }
    const idx = memoryStore.users.findIndex(u => u.email.trim().toLowerCase() === cleanEmail || u.id === user.id);
    if (idx >= 0) {
      const existingStatus = memoryStore.users[idx].status;
      memoryStore.users[idx] = {
        ...memoryStore.users[idx],
        ...user,
        email: cleanEmail,
        status: existingStatus === 'approved' ? 'approved' : (user.status || existingStatus || 'pending')
      };
    } else {
      memoryStore.users.push({ ...user, email: cleanEmail });
    }
    saveMemoryFallback();
    return user;
  },

  async update(user: Partial<SeedUser> & { id: string }): Promise<SeedUser | undefined> {
    if (isPostgresConnected) {
      const existing = (await userDb.findById(user.id)) || (user.email ? await userDb.findByEmail(user.email) : undefined);
      if (!existing) return undefined;
      const updated = { ...existing, ...user };
      await pool.query(`
        UPDATE users
        SET full_name = $2, role = $3, status = $4, room_number = $5, password = COALESCE($6, password)
        WHERE id = $1 OR LOWER(TRIM(email)) = LOWER(TRIM($7))
      `, [existing.id, updated.fullName, updated.role, updated.status, updated.roomNumber || null, user.password || null, existing.email]);
      return updated;
    }
    const idx = memoryStore.users.findIndex(u => u.id === user.id || (user.email && u.email.trim().toLowerCase() === user.email.trim().toLowerCase()));
    if (idx >= 0) {
      memoryStore.users[idx] = { ...memoryStore.users[idx], ...user };
      saveMemoryFallback();
      return memoryStore.users[idx];
    }
    return undefined;
  },

  async delete(id: string): Promise<boolean> {
    if (isPostgresConnected) {
      try {
        await pool.query('DELETE FROM judge_assignments WHERE judge_id = $1 OR LOWER(TRIM(judge_email)) = LOWER(TRIM($1))', [id]);
      } catch {}
      const res = await pool.query('DELETE FROM users WHERE id = $1 OR LOWER(TRIM(email)) = LOWER(TRIM($1))', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const initial = memoryStore.users.length;
    memoryStore.users = memoryStore.users.filter(u => u.id !== id && u.email.trim().toLowerCase() !== id.trim().toLowerCase());
    if (memoryStore.assignments) {
      memoryStore.assignments = memoryStore.assignments.filter(a => a.judgeId !== id && a.judgeEmail.trim().toLowerCase() !== id.trim().toLowerCase());
    }
    if (memoryStore.users.length < initial) {
      saveMemoryFallback();
      return true;
    }
    return false;
  },

  async updatePassword(email: string, newPassword: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    let pgSuccess = false;
    if (isPostgresConnected) {
      try {
        const res = await pool.query(
          'UPDATE users SET password = $1 WHERE LOWER(TRIM(email)) = $2',
          [newPassword, cleanEmail]
        );
        pgSuccess = (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.error('[userDb.updatePassword] Postgres query failed:', err);
      }
    }
    let memSuccess = false;
    const idx = memoryStore.users.findIndex(u => u.email.trim().toLowerCase() === cleanEmail);
    if (idx >= 0) {
      memoryStore.users[idx] = { ...memoryStore.users[idx], password: newPassword };
      saveMemoryFallback();
      memSuccess = true;
    }
    return pgSuccess || memSuccess;
  }
};

// --- ROOM DATA ACCESS OBJECT ---
export const roomDb = {
  async getAll(): Promise<SeedRoom[]> {
    if (isPostgresConnected) {
      const res = await pool.query(`
        SELECT id, room_number as "roomNumber", name, location, capacity, description, created_at as "createdAt"
        FROM rooms ORDER BY room_number ASC
      `);
      return res.rows;
    }
    return [...memoryStore.rooms];
  },

  async create(room: SeedRoom): Promise<SeedRoom> {
    if (isPostgresConnected) {
      await pool.query(`
        INSERT INTO rooms (id, room_number, name, location, capacity, description, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [room.id, room.roomNumber, room.name, room.location || null, room.capacity || 10, room.description || null, room.createdAt]);
      return room;
    }
    memoryStore.rooms.push(room);
    saveMemoryFallback();
    return room;
  },

  async update(room: SeedRoom): Promise<SeedRoom> {
    if (isPostgresConnected) {
      await pool.query(`
        UPDATE rooms
        SET room_number = $2, name = $3, location = $4, capacity = $5, description = $6
        WHERE id = $1
      `, [room.id, room.roomNumber, room.name, room.location || null, room.capacity || 10, room.description || null]);
      return room;
    }
    const idx = memoryStore.rooms.findIndex(r => r.id === room.id);
    if (idx >= 0) {
      memoryStore.rooms[idx] = room;
      saveMemoryFallback();
    }
    return room;
  },

  async delete(id: string): Promise<boolean> {
    if (isPostgresConnected) {
      const res = await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const initial = memoryStore.rooms.length;
    memoryStore.rooms = memoryStore.rooms.filter(r => r.id !== id);
    if (memoryStore.rooms.length < initial) {
      saveMemoryFallback();
      return true;
    }
    return false;
  }
};

// --- PROJECT DATA ACCESS OBJECT ---
export const projectDb = {
  async getAll(): Promise<SeedProject[]> {
    if (isPostgresConnected) {
      const res = await pool.query(`
        SELECT id, title, application_id as "applicationId", project_code as "projectCode",
               application_type as "applicationType", head_category as "headCategory",
               team_or_org_name as "teamOrOrgName", representative_name as "representativeName",
               team_lead_name as "teamLeadName",
               members, email, contact_number as "contactNumber", institution_or_org as "institutionOrOrg",
               description, problem_statement as "problemStatement", solution_summary as "solutionSummary",
               tags, room_number as "roomNumber", status
        FROM projects ORDER BY application_id ASC
      `);
      return res.rows.map(row => ({
        ...row,
        members: typeof row.members === 'string' ? JSON.parse(row.members) : row.members || [],
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || []
      }));
    }
    return [...memoryStore.projects];
  },

  async findById(id: string): Promise<SeedProject | undefined> {
    if (isPostgresConnected) {
      const res = await pool.query(`
        SELECT id, title, application_id as "applicationId", project_code as "projectCode",
               application_type as "applicationType", head_category as "headCategory",
               team_or_org_name as "teamOrOrgName", representative_name as "representativeName",
               team_lead_name as "teamLeadName",
               members, email, contact_number as "contactNumber", institution_or_org as "institutionOrOrg",
               description, problem_statement as "problemStatement", solution_summary as "solutionSummary",
               tags, room_number as "roomNumber", status
        FROM projects WHERE id = $1 LIMIT 1
      `, [id]);
      if (!res.rows[0]) return undefined;
      const row = res.rows[0];
      return {
        ...row,
        members: typeof row.members === 'string' ? JSON.parse(row.members) : row.members || [],
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || []
      };
    }
    return memoryStore.projects.find(p => p.id === id);
  },

  async create(project: SeedProject): Promise<SeedProject> {
    const title = (project.title || (project as any).solutionName || 'Untitled Project').trim();
    const appId = (project.applicationId || `BIIN-2026-${Date.now().toString().slice(-4)}`).trim();
    const projCode = (project.projectCode || appId).trim();
    const appType = project.applicationType || 'Student-Secondary';
    const headCat = project.headCategory || null;
    const team = (project.teamOrOrgName || title || 'Independent').trim();
    const rep = (project.representativeName || 'Lead Contact').trim();
    const desc = (project.description || (project as any).projectOverview || (project as any).solutionSummary || 'No project description provided.').trim();
    const prob = project.problemStatement || null;
    const sol = project.solutionSummary || null;
    const email = project.email || 'contact@biin.org';
    const contact = project.contactNumber || 'N/A';
    const inst = project.institutionOrOrg || null;
    const status = (project.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
    const tags = Array.isArray(project.tags) ? project.tags : [];
    const members = Array.isArray(project.members) ? project.members : [];
    const id = project.id || `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const sanitized: SeedProject = {
      ...project,
      id,
      title,
      applicationId: appId,
      projectCode: projCode,
      applicationType: appType,
      headCategory: headCat || 'N/A',
      teamOrOrgName: team,
      representativeName: rep,
      description: desc,
      email,
      contactNumber: contact,
      status
    };

    if (isPostgresConnected) {
      await pool.query(`
        INSERT INTO projects (
          id, title, application_id, project_code, application_type, head_category,
          team_or_org_name, representative_name, team_lead_name, members, email, contact_number,
          institution_or_org, description, problem_statement, solution_summary,
          tags, room_number, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (application_id) DO UPDATE SET
          title = EXCLUDED.title,
          project_code = EXCLUDED.project_code,
          application_type = EXCLUDED.application_type,
          head_category = EXCLUDED.head_category,
          team_or_org_name = EXCLUDED.team_or_org_name,
          representative_name = EXCLUDED.representative_name,
          team_lead_name = EXCLUDED.team_lead_name,
          members = EXCLUDED.members,
          email = EXCLUDED.email,
          contact_number = EXCLUDED.contact_number,
          institution_or_org = EXCLUDED.institution_or_org,
          description = EXCLUDED.description,
          problem_statement = EXCLUDED.problem_statement,
          solution_summary = EXCLUDED.solution_summary,
          tags = EXCLUDED.tags,
          room_number = EXCLUDED.room_number,
          status = EXCLUDED.status
      `, [
        id, title, appId, projCode, appType, headCat,
        team, rep, project.teamLeadName || null, JSON.stringify(members),
        email, contact, inst, desc,
        prob, sol, JSON.stringify(tags),
        project.roomNumber || null, status
      ]);
      return sanitized;
    }
    const idx = memoryStore.projects.findIndex(p => p.id === id || p.applicationId === appId);
    if (idx >= 0) {
      memoryStore.projects[idx] = sanitized;
    } else {
      memoryStore.projects.push(sanitized);
    }
    saveMemoryFallback();
    return sanitized;
  },

  async update(project: SeedProject): Promise<SeedProject> {
    const title = (project.title || (project as any).solutionName || 'Untitled Project').trim();
    const desc = (project.description || (project as any).projectOverview || (project as any).solutionSummary || 'No description').trim();
    const status = (project.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';
    const team = (project.teamOrOrgName || title || 'Independent').trim();
    const rep = (project.representativeName || 'Lead Contact').trim();

    if (isPostgresConnected) {
      await pool.query(`
        UPDATE projects
        SET title = $2, application_id = $3, project_code = $4, application_type = $5, head_category = $6,
            team_or_org_name = $7, representative_name = $8, team_lead_name = $9, members = $10, email = $11, contact_number = $12,
            institution_or_org = $13, description = $14, problem_statement = $15, solution_summary = $16,
            tags = $17, room_number = $18, status = $19
        WHERE id = $1
      `, [
        project.id, title, project.applicationId, project.projectCode, project.applicationType, project.headCategory || null,
        team, rep, project.teamLeadName || null, JSON.stringify(project.members || []),
        project.email || 'contact@biin.org', project.contactNumber || 'N/A', project.institutionOrOrg || null, desc,
        project.problemStatement || null, project.solutionSummary || null, JSON.stringify(project.tags || []),
        project.roomNumber || null, status
      ]);
      return project;
    }
    const idx = memoryStore.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      memoryStore.projects[idx] = project;
      saveMemoryFallback();
    }
    return project;
  },

  async delete(id: string): Promise<boolean> {
    if (isPostgresConnected) {
      const res = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
      try {
        // Clean up assignment references to this project
        const asgns = await pool.query('SELECT id, project_ids FROM judge_assignments');
        for (const row of asgns.rows) {
          const pIds = typeof row.project_ids === 'string' ? JSON.parse(row.project_ids) : row.project_ids || [];
          if (Array.isArray(pIds) && pIds.includes(id)) {
            const updated = pIds.filter((pId: string) => pId !== id);
            await pool.query('UPDATE judge_assignments SET project_ids = $1 WHERE id = $2', [JSON.stringify(updated), row.id]);
          }
        }
      } catch (err) {
        console.warn('[projectDb.delete] Assignment cleanup notice:', err);
      }
      return (res.rowCount ?? 0) > 0;
    }
    const initial = memoryStore.projects.length;
    memoryStore.projects = memoryStore.projects.filter(p => p.id !== id);
    memoryStore.evaluations = memoryStore.evaluations.filter(e => e.projectId !== id);
    if (Array.isArray(memoryStore.assignments)) {
      for (const a of memoryStore.assignments) {
        if (Array.isArray(a.projectIds)) {
          a.projectIds = a.projectIds.filter(pId => pId !== id);
        }
      }
    }
    if (memoryStore.projects.length < initial) {
      saveMemoryFallback();
      return true;
    }
    return false;
  },

  async bulkCreate(projects: SeedProject[]): Promise<number> {
    let count = 0;
    for (const proj of projects) {
      try {
        const existing = (await projectDb.findById(proj.id)) ||
                         (proj.applicationId ? (await projectDb.getAll()).find(p => p.applicationId === proj.applicationId) : undefined);
        if (!existing) {
          await projectDb.create(proj);
          count++;
        }
      } catch (err) {
        console.warn('[projectDb.bulkCreate] Skipped invalid project row:', err);
      }
    }
    return count;
  }
};

// --- EVALUATION DATA ACCESS OBJECT ---
export const evaluationDb = {
  async getAll(): Promise<SeedEvaluation[]> {
    if (isPostgresConnected) {
      const res = await pool.query(`
        SELECT id, project_id as "projectId", judge_email as "judgeEmail", judge_name as "judgeName",
               scores, feedback, raw_total_score as "rawTotalScore", max_raw_score as "maxRawScore",
               converted_score as "convertedScore", room_number as "roomNumber",
               total_score as "totalScore", percentage, submitted_at as "submittedAt"
        FROM evaluations ORDER BY submitted_at DESC
      `);
      return res.rows.map(row => ({
        ...row,
        rawTotalScore: Number(row.rawTotalScore),
        maxRawScore: Number(row.maxRawScore),
        convertedScore: Number(row.convertedScore),
        totalScore: Number(row.totalScore),
        percentage: Number(row.percentage),
        scores: typeof row.scores === 'string' ? JSON.parse(row.scores) : row.scores
      }));
    }
    return [...memoryStore.evaluations];
  },

  async getByJudge(judgeEmail: string): Promise<SeedEvaluation[]> {
    const all = await evaluationDb.getAll();
    return all.filter(e => e.judgeEmail.toLowerCase() === judgeEmail.toLowerCase());
  },

  async getForProject(projectId: string, judgeEmail: string): Promise<SeedEvaluation | undefined> {
    const all = await evaluationDb.getAll();
    return all.find(e => e.projectId === projectId && e.judgeEmail.toLowerCase() === judgeEmail.toLowerCase());
  },

  async save(evaluation: SeedEvaluation): Promise<SeedEvaluation> {
    const rawScores = evaluation.scores || {};
    const scoreVals = Object.values(rawScores).map(v => Number(v) || 0);
    const calculatedRaw = scoreVals.length > 0 ? scoreVals.reduce((a, b) => a + b, 0) : 0;
    const maxRaw = Number(evaluation.maxRawScore || (scoreVals.length * 10 || 100));
    const rawTotal = Number(evaluation.rawTotalScore ?? (evaluation.totalScore ?? calculatedRaw));
    const converted = Number(evaluation.convertedScore ?? (maxRaw > 0 ? (rawTotal / maxRaw) * 100 : rawTotal));
    const total = Number(evaluation.totalScore ?? converted);
    const percentage = Number(evaluation.percentage ?? (maxRaw > 0 ? (rawTotal / maxRaw) * 100 : total));

    const normalizedEval: SeedEvaluation = {
      ...evaluation,
      rawTotalScore: rawTotal,
      maxRawScore: maxRaw,
      convertedScore: converted,
      totalScore: total,
      percentage: percentage,
      submittedAt: evaluation.submittedAt || new Date().toISOString()
    };

    if (isPostgresConnected) {
      await pool.query(`
        INSERT INTO evaluations (
          id, project_id, judge_email, judge_name, scores, feedback,
          raw_total_score, max_raw_score, converted_score, room_number,
          total_score, percentage, submitted_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (project_id, judge_email) DO UPDATE SET
          scores = EXCLUDED.scores,
          feedback = EXCLUDED.feedback,
          raw_total_score = EXCLUDED.raw_total_score,
          max_raw_score = EXCLUDED.max_raw_score,
          converted_score = EXCLUDED.converted_score,
          room_number = EXCLUDED.room_number,
          total_score = EXCLUDED.total_score,
          percentage = EXCLUDED.percentage,
          updated_at = NOW()
      `, [
        normalizedEval.id, normalizedEval.projectId, normalizedEval.judgeEmail.toLowerCase(), normalizedEval.judgeName,
        JSON.stringify(normalizedEval.scores), normalizedEval.feedback || null,
        normalizedEval.rawTotalScore, normalizedEval.maxRawScore, normalizedEval.convertedScore,
        normalizedEval.roomNumber || null, normalizedEval.totalScore, normalizedEval.percentage,
        normalizedEval.submittedAt
      ]);
      return normalizedEval;
    }
    const idx = memoryStore.evaluations.findIndex(
      e => e.projectId === normalizedEval.projectId && e.judgeEmail.toLowerCase() === normalizedEval.judgeEmail.toLowerCase()
    );
    if (idx >= 0) {
      memoryStore.evaluations[idx] = normalizedEval;
    } else {
      memoryStore.evaluations.push(normalizedEval);
    }
    saveMemoryFallback();
    return normalizedEval;
  },

  async delete(id: string): Promise<boolean> {
    if (isPostgresConnected) {
      const res = await pool.query('DELETE FROM evaluations WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const initial = memoryStore.evaluations.length;
    memoryStore.evaluations = memoryStore.evaluations.filter(e => e.id !== id);
    saveMemoryFallback();
    return memoryStore.evaluations.length < initial;
  }
};

// --- SYSTEM SETTINGS DATA ACCESS OBJECT ---
export const settingsDb = {
  async get(): Promise<typeof SEED_SETTINGS> {
    if (isPostgresConnected) {
      const res = await pool.query(`
        SELECT evaluations_locked as "evaluationsLocked",
               final_results_locked as "finalResultsLocked",
               locked_projects as "lockedProjects",
               auto_ranking_enabled as "autoRankingEnabled"
        FROM system_settings WHERE id = 'global' LIMIT 1
      `);
      if (res.rows[0]) {
        const row = res.rows[0];
        return {
          id: 'global',
          evaluationsLocked: row.evaluationsLocked,
          finalResultsLocked: row.finalResultsLocked,
          lockedProjects: typeof row.lockedProjects === 'string' ? JSON.parse(row.lockedProjects) : row.lockedProjects || [],
          autoRankingEnabled: row.autoRankingEnabled
        };
      }
    }
    return { ...memoryStore.settings };
  },

  async update(settings: Partial<typeof SEED_SETTINGS>): Promise<typeof SEED_SETTINGS> {
    if (isPostgresConnected) {
      const current = await settingsDb.get();
      const updated = { ...current, ...settings };
      await pool.query(`
        INSERT INTO system_settings (id, evaluations_locked, final_results_locked, locked_projects, auto_ranking_enabled, updated_at)
        VALUES ('global', $1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO UPDATE SET
          evaluations_locked = EXCLUDED.evaluations_locked,
          final_results_locked = EXCLUDED.final_results_locked,
          locked_projects = EXCLUDED.locked_projects,
          auto_ranking_enabled = EXCLUDED.auto_ranking_enabled,
          updated_at = NOW()
      `, [updated.evaluationsLocked, updated.finalResultsLocked, JSON.stringify(updated.lockedProjects), updated.autoRankingEnabled]);
      return updated;
    }
    memoryStore.settings = { ...memoryStore.settings, ...settings };
    saveMemoryFallback();
    return { ...memoryStore.settings };
  }
};

// --- AUDIT LOGS DATA ACCESS OBJECT ---
export const auditDb = {
  async getAll(): Promise<typeof SEED_AUDIT_LOGS> {
    if (isPostgresConnected) {
      const res = await pool.query(`
        SELECT id, actor_email as "actorEmail", actor_name as "actorName",
               action, target_type as "targetType", details, timestamp
        FROM audit_logs ORDER BY timestamp DESC LIMIT 200
      `);
      return res.rows;
    }
    return [...memoryStore.auditLogs];
  },

  async create(entry: {
    id: string;
    actorEmail?: string;
    actorName?: string;
    action: string;
    targetType: string;
    details: string;
    timestamp: string;
  }): Promise<void> {
    const safeEmail = (entry.actorEmail || 'admin@biin.org').trim().toLowerCase();
    const safeName = (entry.actorName || 'Administrator').trim();
    if (isPostgresConnected) {
      try {
        await pool.query(`
          INSERT INTO audit_logs (id, actor_email, actor_name, action, target_type, details, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [entry.id, safeEmail, safeName, entry.action, entry.targetType, entry.details, entry.timestamp]);
      } catch (err) {
        console.warn('[auditDb.create] Failed to write audit log:', err);
      }
      return;
    }
    memoryStore.auditLogs.unshift({
      ...entry,
      actorEmail: safeEmail,
      actorName: safeName
    });
    if (memoryStore.auditLogs.length > 200) {
      memoryStore.auditLogs.pop();
    }
    saveMemoryFallback();
  }
};

// --- JUDGE ASSIGNMENT DATA ACCESS OBJECT ---
export const assignmentDb = {
  async getAll(): Promise<SeedAssignment[]> {
    if (isPostgresConnected) {
      const res = await pool.query(`
        SELECT id, judge_id as "judgeId", judge_email as "judgeEmail", judge_name as "judgeName",
               application_type as "applicationType", head_category as "headCategory",
               project_ids as "projectIds", created_at as "createdAt"
        FROM judge_assignments ORDER BY created_at DESC
      `);
      return res.rows.map(row => ({
        ...row,
        projectIds: typeof row.projectIds === 'string' ? JSON.parse(row.projectIds) : row.projectIds || []
      }));
    }
    return [...(memoryStore.assignments || [])];
  },

  async getByJudge(identifier: string): Promise<SeedAssignment[]> {
    const all = await assignmentDb.getAll();
    const clean = identifier.trim().toLowerCase();
    return all.filter(a => a.judgeEmail.trim().toLowerCase() === clean || a.judgeId.trim().toLowerCase() === clean);
  },

  async create(assignment: SeedAssignment): Promise<SeedAssignment> {
    if (isPostgresConnected) {
      await pool.query(`
        INSERT INTO judge_assignments (
          id, judge_id, judge_email, judge_name, application_type, head_category, project_ids, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          judge_name = EXCLUDED.judge_name,
          application_type = EXCLUDED.application_type,
          head_category = EXCLUDED.head_category,
          project_ids = EXCLUDED.project_ids
      `, [
        assignment.id, assignment.judgeId, assignment.judgeEmail.trim().toLowerCase(), assignment.judgeName,
        assignment.applicationType, assignment.headCategory || null,
        JSON.stringify(assignment.projectIds || []), assignment.createdAt || new Date().toISOString()
      ]);
      return assignment;
    }
    if (!memoryStore.assignments) memoryStore.assignments = [];
    const idx = memoryStore.assignments.findIndex(a => a.id === assignment.id);
    if (idx >= 0) {
      memoryStore.assignments[idx] = assignment;
    } else {
      memoryStore.assignments.push(assignment);
    }
    saveMemoryFallback();
    return assignment;
  },

  async delete(id: string): Promise<boolean> {
    if (isPostgresConnected) {
      const res = await pool.query('DELETE FROM judge_assignments WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    if (!memoryStore.assignments) return false;
    const initial = memoryStore.assignments.length;
    memoryStore.assignments = memoryStore.assignments.filter(a => a.id !== id);
    if (memoryStore.assignments.length < initial) {
      saveMemoryFallback();
      return true;
    }
    return false;
  }
};
