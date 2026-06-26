const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const backupDir = process.env.BACKUP_DIR || '/backups';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `sennara-${timestamp}.sql.gz`;
const filepath = path.join(backupDir, filename);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log(`Creating backup: ${filepath}`);
try {
  execSync(`pg_dump "${databaseUrl}" | gzip > "${filepath}"`, { stdio: 'inherit' });
  console.log('Backup completed successfully.');
} catch (err) {
  console.error('Backup failed:', err);
  process.exit(1);
}
