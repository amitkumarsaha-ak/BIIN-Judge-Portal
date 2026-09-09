# BIIN Judge Portal - Backend & Database (Node.js + Express + PostgreSQL)

## Overview
This is the dedicated backend REST API server and PostgreSQL integration layer for the **BIIN Judge Portal**.

## Features
- **Express 4 & TypeScript**: Fully typed REST API routes for authentication, projects, evaluations, judges, rooms, locks, and audit logs.
- **PostgreSQL 18**: Tables with primary keys, foreign key constraints, JSONB support for criteria/tags, and indexes.
- **Auto-Migration & Seeding**: Tables and default seed data are initialized automatically on boot.
- **Zero-Crash In-Memory Fallback**: If PostgreSQL credentials are being configured, the server seamlessly runs with an in-memory data store without crashing, ensuring smooth testing and development.
- **Frontend Sync**: The client portal automatically synchronizes with the REST backend while maintaining local caching for offline resilience.

---

## Configuration (`server/.env`)

Edit `server/.env` with your PostgreSQL credentials:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL Connection Settings
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_postgres_password_here
PGDATABASE=biin_judge_portal

# Fixed Super Admin Configuration
ADMIN_EMAIL=admin@biin.org
ADMIN_PASSWORD=admin123
ADMIN_NAME=BIIN Administrator
```

> **Note for Local Setup**:
> If you have set a master password when installing PostgreSQL 18 on Windows, simply replace `your_postgres_password_here` with your actual password in `server/.env`.

---

## Commands

From the root directory:
- Start Vite frontend: `npm run dev`
- Start Backend API server: `npm run server`
- Initialize Database / Seed: `npm run server:init`

From the `server` directory:
- `npm run dev`: Start server in watch mode using `tsx`
- `npm run build`: Compile TypeScript into `dist/`
- `npm run db:init`: Run schema migrations and seed initial data
- `npm start`: Run compiled production server
