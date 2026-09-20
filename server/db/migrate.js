const fs = require('fs');
const path = require('path');
const db = require('./index');

async function migrate() {
  console.log('🔄 Running database schema migration...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Split schema into individual executable statements
  const statements = schemaSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    try {
      await db.query(statement);
    } catch (err) {
      console.error('Migration statement error:', err.message);
      console.error('Offending statement:', statement);
      throw err;
    }
  }

  console.log('✅ Database schema migration completed successfully.');
}

if (require.main === module) {
  migrate().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = migrate;
