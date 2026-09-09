import { initDatabase, getDbStatus } from './index.js';

async function main() {
  console.log('🚀 [Seed] Running database initialization...');
  const status = await initDatabase();
  console.log(`📊 [Seed] Status: ${status.type.toUpperCase()} | Connected: ${status.connected}`);
  console.log(`💬 [Seed] Details: ${status.message}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ [Seed] Unhandled error during database initialization:', err);
  process.exit(1);
});
