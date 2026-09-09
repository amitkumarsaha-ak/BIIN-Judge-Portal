# Vercel & Online Cloud Database Deployment Guide

## Problem Summary
- **Current State**: Your PostgreSQL is running locally on your computer (`localhost:5432`) and your backend Express server is running on `localhost:5000`.
- **Why Vercel shows Offline**: Vercel is hosted on the public internet. It cannot reach `localhost:5432` on your personal laptop/PC.
- **The Goal**: Put your PostgreSQL database and backend server on a free 24/7 cloud host so all judges can open the portal on their phones/laptops from anywhere in the world.

---

## Step 1: Create a Free Cloud PostgreSQL Database (2 Minutes)

1. Go to **https://neon.tech** (or **https://supabase.com**) and sign in with GitHub.
2. Click **Create Project** -> Name it `biin-judge-portal`.
3. You will immediately get a **Connection String** that looks like this:
   ```text
   postgresql://neondb_owner:AbCdEfGh123@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy this connection string.

---

## Step 2: Deploy Backend Server to Render.com (Free 24/7 Hosting)

1. Push your code to GitHub (your repo is `https://github.com/amitkumarsaha-ak/BIIN-Judge-Portal`).
2. Go to **https://render.com** and sign in with GitHub.
3. Click **New +** -> **Web Service**.
4. Select your GitHub repository: `BIIN-Judge-Portal`.
5. Fill in these settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free`
6. Scroll down to **Environment Variables** and add:
   - `DATABASE_URL`: *(Paste the Neon PostgreSQL connection string from Step 1)*
   - `ADMIN_EMAIL`: `admin@biin.org`
   - `ADMIN_PASSWORD`: `admin123`
   - `ADMIN_NAME`: `BIIN Administrator`
7. Click **Create Web Service**.
8. Once deployed, Render will give you a public URL, for example:
   `https://biin-judge-portal-api.onrender.com`

---

## Step 3: Connect Vercel to Your Cloud Backend

1. Open your **Vercel Project Dashboard** -> **Settings** -> **Environment Variables**.
2. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://biin-judge-portal-api.onrender.com` *(your Render backend URL)*
3. Click **Save**.
4. Go to the **Deployments** tab in Vercel -> Click the 3 dots on the latest deployment -> Click **Redeploy**.

---

## Result
- **Database Status**: The green light on Vercel will turn on showing **PostgreSQL Online**.
- **Cross-Device Access**: Any judge or admin opening the Vercel link from mobile, tablet, or desktop anywhere in the world will share the exact same live database.
