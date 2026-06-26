const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', '..', 'database', 'migrations');
  const seedsDir = path.join(__dirname, '..', '..', 'database', 'seeds');

  const files = fs.readdirSync(migrationsDir).sort();

  console.log('Running migrations...');
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`  → ${file}`);
      await pool.query(sql);
    }
  }

  console.log('Running seeds...');
  const seedFiles = fs.readdirSync(seedsDir).sort();
  for (const file of seedFiles) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
      console.log(`  → ${file}`);
      await pool.query(sql);
    }
  }

  console.log('Migrations complete.');
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
