/**
 * Configuration for BIIN Judge Portal Single Fixed Admin Account.
 * 
 * You can configure the actual credentials by setting VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD
 * in a .env file or directly changing the fallback placeholders below.
 */
const getEnv = (key: string): string | undefined => {
  try {
    const meta = (new Function('try { return import.meta; } catch(e) { return null; }'))();
    if (meta?.env?.[key]) return meta.env[key];
  } catch {}
  try {
    const proc = (new Function('try { return process; } catch(e) { return null; }'))();
    if (proc?.env?.[key]) return proc.env[key];
  } catch {}
  return undefined;
};

export const ADMIN_CONFIG = {
  EMAIL: getEnv('VITE_ADMIN_EMAIL') || 'admin@biin.org',
  PASSWORD: getEnv('VITE_ADMIN_PASSWORD') || 'admin123',
  NAME: 'BIIN Administrator'
};


