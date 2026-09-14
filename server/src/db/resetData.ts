import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { SEED_ROOMS, SEED_SETTINGS } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_STORE_FILE = path.join(__dirname, '../../.memory_store.json');

const serverEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}
dotenv.config();

const { Pool } = pg;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        max: 5
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'biin_judge_portal',
        connectionTimeoutMillis: 4000,
        max: 5
      }
);

async function resetAllData() {
  console.log('=== BIIN JUDGE PORTAL - COMPLETE DATA RESET ===');
  const adminHashedPassword = hashPassword('admin123');

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully.');

    await client.query('BEGIN');

    // 1. Purge evaluations, assignments, and projects
    const delEvals = await client.query('DELETE FROM evaluations');
    console.log(`Deleted ${delEvals.rowCount ?? 0} evaluations.`);

    const delAssignments = await client.query('DELETE FROM judge_assignments');
    console.log(`Deleted ${delAssignments.rowCount ?? 0} judge assignments.`);

    const delProjects = await client.query('DELETE FROM projects');
    console.log(`Deleted ${delProjects.rowCount ?? 0} projects.`);

    // 2. Delete all non-admin users
    const delJudges = await client.query("DELETE FROM users WHERE LOWER(TRIM(role)) != 'admin'");
    console.log(`Deleted ${delJudges.rowCount ?? 0} non-admin user accounts.`);

    // 3. Ensure Admin account exists, is approved, and has hashed password
    const adminCheck = await client.query("SELECT id, email, role, status FROM users WHERE LOWER(TRIM(email)) = 'admin@biin.org'");
    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (id, email, password, full_name, role, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        ['u-admin-1', 'admin@biin.org', adminHashedPassword, 'System Administrator', 'admin', 'approved']
      );
      console.log('Created fresh Admin account in PostgreSQL.');
    } else {
      await client.query(
        `UPDATE users SET password = $1, status = 'approved', role = 'admin' WHERE LOWER(TRIM(email)) = 'admin@biin.org'`,
        [adminHashedPassword]
      );
      console.log('Updated existing Admin account in PostgreSQL with fresh hashed password.');
    }

    // 4. Ensure rooms exist
    for (const room of SEED_ROOMS) {
      await client.query(
        `INSERT INTO rooms (id, room_number, name, location, capacity, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [room.id, room.roomNumber, room.name, room.location || null, room.capacity || 10, room.description || null, room.createdAt]
      );
    }
    console.log(`Ensured ${SEED_ROOMS.length} default rooms exist in PostgreSQL.`);

    await client.query('COMMIT');
    client.release();
    console.log('PostgreSQL transaction committed successfully.');
  } catch (err) {
    console.error('PostgreSQL reset encountered an error (or Postgres was not reachable):', err);
  }

  // 5. Reset fallback memory store
  const cleanMemoryStore = {
    users: [
      {
        id: 'u-admin-1',
        email: 'admin@biin.org',
        password: adminHashedPassword,
        fullName: 'System Administrator',
        role: 'admin',
        status: 'approved',
        createdAt: new Date().toISOString()
      }
    ],
    rooms: [...SEED_ROOMS],
    projects: [],
    evaluations: [],
    assignments: [],
    settings: { ...SEED_SETTINGS },
    auditLogs: []
  };

  try {
    fs.writeFileSync(FALLBACK_STORE_FILE, JSON.stringify(cleanMemoryStore, null, 2), 'utf8');
    console.log(`Reset ${FALLBACK_STORE_FILE} successfully.`);
  } catch (err) {
    console.error(`Failed to write fallback memory store:`, err);
  }

  await pool.end();
  console.log('=== DATA RESET COMPLETE ===');
}

resetAllData();
