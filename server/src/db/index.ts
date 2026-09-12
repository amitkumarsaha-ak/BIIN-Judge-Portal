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
  SeedEvaluation
} from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

      // Check if data is already seeded
      const countRes = await client.query('SELECT COUNT(*) FROM users');
      const userCount = parseInt(countRes.rows[0].count, 10);

      if (userCount === 0) {
        console.log('[Database] Seeding initial data into PostgreSQL...');
        // Seed users
        for (const u of SEED_USERS) {
          await client.query(
            `INSERT INTO users (id, full_name, email, password, role, status, room_number, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, password = EXCLUDED.password`,
            [u.id, u.fullName, u.email.toLowerCase(), u.password, u.role, u.status, u.roomNumber || null, u.createdAt]
          );
        }

        // Seed rooms
        for (const r of SEED_ROOMS) {
          await client.query(
            `INSERT INTO rooms (id, room_number, name, location, capacity, description, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (room_number) DO NOTHING`,
            [r.id, r.roomNumber, r.name, r.location || null, r.capacity || 10, r.description || null, r.createdAt]
          );
        }

        // Seed projects
        for (const p of SEED_PROJECTS) {
          await client.query(
            `INSERT INTO projects (
               id, title, application_id, project_code, application_type, head_category,
               team_or_org_name, representative_name, members, email, contact_number,
               institution_or_org, description, problem_statement, solution_summary,
               tags, room_number, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
             ON CONFLICT (application_id) DO NOTHING`,
            [
              p.id, p.title, p.applicationId, p.projectCode, p.applicationType, p.headCategory,
              p.teamOrOrgName, p.representativeName, JSON.stringify(p.members || []),
              p.email, p.contactNumber, p.institutionOrOrg || null, p.description,
              p.problemStatement || null, p.solutionSummary || null, JSON.stringify(p.tags || []),
              p.roomNumber || null, p.status
            ]
          );
        }

        // Seed evaluations
        for (const e of SEED_EVALUATIONS) {
          await client.query(
            `INSERT INTO evaluations (
               id, project_id, judge_email, judge_name, scores, feedback,
               raw_total_score, max_raw_score, converted_score, room_number,
               total_score, percentage, submitted_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (project_id, judge_email) DO NOTHING`,
            [
              e.id, e.projectId, e.judgeEmail.toLowerCase(), e.judgeName, JSON.stringify(e.scores),
              e.feedback || null, e.rawTotalScore, e.maxRawScore, e.convertedScore,
              e.roomNumber || null, e.totalScore, e.percentage, e.submittedAt
            ]
          );
        }

        // Seed settings
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
            [a.id, a.actorEmail, a.actorName, a.action, a.targetType, a.details, a.timestamp]
          );
        }
        console.log('[Database] PostgreSQL seeded successfully.');
      }

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
      const res = await pool.query(`
        SELECT id, full_name as "fullName", email, password, role, status,
               room_number as "roomNumber", created_at as "createdAt"
        FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1
      `, [cleanEmail]);
      return res.rows[0];
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
    if (isPostgresConnected) {
      await pool.query(`
        INSERT INTO users (id, full_name, email, password, role, status, room_number, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        user.id, user.fullName, user.email.toLowerCase().trim(), user.password,
        user.role, user.status, user.roomNumber || null, user.createdAt
      ]);
      return user;
    }
    memoryStore.users.push(user);
    return user;
  },

  async update(user: Partial<SeedUser> & { id: string }): Promise<SeedUser | undefined> {
    if (isPostgresConnected) {
      const existing = await userDb.findById(user.id);
      if (!existing) return undefined;
      const updated = { ...existing, ...user };
      await pool.query(`
        UPDATE users
        SET full_name = $2, role = $3, status = $4, room_number = $5
        WHERE id = $1
      `, [user.id, updated.fullName, updated.role, updated.status, updated.roomNumber || null]);
      return updated;
    }
    const idx = memoryStore.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      memoryStore.users[idx] = { ...memoryStore.users[idx], ...user };
      return memoryStore.users[idx];
    }
    return undefined;
  },

  async delete(id: string): Promise<boolean> {
    if (isPostgresConnected) {
      const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const initial = memoryStore.users.length;
    memoryStore.users = memoryStore.users.filter(u => u.id !== id);
    return memoryStore.users.length < initial;
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
    return memoryStore.rooms.length < initial;
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
    if (isPostgresConnected) {
      await pool.query(`
        INSERT INTO projects (
          id, title, application_id, project_code, application_type, head_category,
          team_or_org_name, representative_name, members, email, contact_number,
          institution_or_org, description, problem_statement, solution_summary,
          tags, room_number, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (application_id) DO UPDATE SET
          title = EXCLUDED.title,
          project_code = EXCLUDED.project_code,
          application_type = EXCLUDED.application_type,
          head_category = EXCLUDED.head_category,
          team_or_org_name = EXCLUDED.team_or_org_name,
          representative_name = EXCLUDED.representative_name,
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
        project.id, project.title, project.applicationId, project.projectCode, project.applicationType, project.headCategory,
        project.teamOrOrgName, project.representativeName, JSON.stringify(project.members || []),
        project.email, project.contactNumber, project.institutionOrOrg || null, project.description,
        project.problemStatement || null, project.solutionSummary || null, JSON.stringify(project.tags || []),
        project.roomNumber || null, project.status
      ]);
      return project;
    }
    const idx = memoryStore.projects.findIndex(p => p.id === project.id || p.applicationId === project.applicationId);
    if (idx >= 0) {
      memoryStore.projects[idx] = project;
    } else {
      memoryStore.projects.push(project);
    }
    saveMemoryFallback();
    return project;
  },

  async update(project: SeedProject): Promise<SeedProject> {
    if (isPostgresConnected) {
      await pool.query(`
        UPDATE projects
        SET title = $2, application_id = $3, project_code = $4, application_type = $5, head_category = $6,
            team_or_org_name = $7, representative_name = $8, members = $9, email = $10, contact_number = $11,
            institution_or_org = $12, description = $13, problem_statement = $14, solution_summary = $15,
            tags = $16, room_number = $17, status = $18
        WHERE id = $1
      `, [
        project.id, project.title, project.applicationId, project.projectCode, project.applicationType, project.headCategory,
        project.teamOrOrgName, project.representativeName, JSON.stringify(project.members || []),
        project.email, project.contactNumber, project.institutionOrOrg || null, project.description,
        project.problemStatement || null, project.solutionSummary || null, JSON.stringify(project.tags || []),
        project.roomNumber || null, project.status
      ]);
      return project;
    }
    const idx = memoryStore.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      memoryStore.projects[idx] = project;
    }
    return project;
  },

  async delete(id: string): Promise<boolean> {
    if (isPostgresConnected) {
      const res = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const initial = memoryStore.projects.length;
    memoryStore.projects = memoryStore.projects.filter(p => p.id !== id);
    memoryStore.evaluations = memoryStore.evaluations.filter(e => e.projectId !== id);
    return memoryStore.projects.length < initial;
  },

  async bulkCreate(projects: SeedProject[]): Promise<number> {
    let count = 0;
    for (const proj of projects) {
      const existing = await projectDb.findById(proj.id);
      if (!existing) {
        await projectDb.create(proj);
        count++;
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
        evaluation.id, evaluation.projectId, evaluation.judgeEmail.toLowerCase(), evaluation.judgeName,
        JSON.stringify(evaluation.scores), evaluation.feedback || null,
        evaluation.rawTotalScore, evaluation.maxRawScore, evaluation.convertedScore,
        evaluation.roomNumber || null, evaluation.totalScore, evaluation.percentage,
        evaluation.submittedAt || new Date().toISOString()
      ]);
      return evaluation;
    }
    const idx = memoryStore.evaluations.findIndex(
      e => e.projectId === evaluation.projectId && e.judgeEmail.toLowerCase() === evaluation.judgeEmail.toLowerCase()
    );
    if (idx >= 0) {
      memoryStore.evaluations[idx] = evaluation;
    } else {
      memoryStore.evaluations.push(evaluation);
    }
    saveMemoryFallback();
    return evaluation;
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
    actorEmail: string;
    actorName: string;
    action: string;
    targetType: string;
    details: string;
    timestamp: string;
  }): Promise<void> {
    if (isPostgresConnected) {
      await pool.query(`
        INSERT INTO audit_logs (id, actor_email, actor_name, action, target_type, details, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [entry.id, entry.actorEmail, entry.actorName, entry.action, entry.targetType, entry.details, entry.timestamp]);
      return;
    }
    memoryStore.auditLogs.unshift(entry);
    if (memoryStore.auditLogs.length > 200) {
      memoryStore.auditLogs.pop();
    }
  }
};
