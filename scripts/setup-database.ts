import { pool, testConnection } from '../src/lib/database.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  console.log('🚀 Setting up Portfolio Database...\n');
  
  try {
    // Test connection first
    console.log('1️⃣ Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    console.log('\n2️⃣ Creating database tables...');
    
    // Read and execute schema
    const schemaPath = join(__dirname, '..', 'database_schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    const client = await pool.connect();
    
    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.code === '42P07' || error.code === '42701' || error.code === '23505') {
          console.log('ℹ️  Skipped (already exists):', statement.substring(0, 50) + '...');
        } else {
          console.error('❌ Error executing:', statement.substring(0, 50) + '...');
          console.error('   Error:', error.message);
        }
      }
    }
    
    client.release();
    
    console.log('\n3️⃣ Verifying table creation...');
    
    const tablesClient = await pool.connect();
    const result = await tablesClient.query(`
      SELECT table_name, 
             (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   📋 ${row.table_name} (${row.column_count} columns)`);
    });
    
    tablesClient.release();
    
    console.log('\n4️⃣ Checking sample data...');
    
    const dataClient = await pool.connect();
    const counts = await Promise.all([
      dataClient.query('SELECT COUNT(*) FROM work_experience'),
      dataClient.query('SELECT COUNT(*) FROM projects'),
      dataClient.query('SELECT COUNT(*) FROM tools'),
      dataClient.query('SELECT COUNT(*) FROM skills'),
      dataClient.query('SELECT COUNT(*) FROM gallery')
    ]);
    
    console.log('\n📈 Data counts:');
    console.log(`   💼 Work Experience: ${counts[0].rows[0].count} records`);
    console.log(`   🚀 Projects: ${counts[1].rows[0].count} records`);
    console.log(`   🛠️  Tools: ${counts[2].rows[0].count} records`);
    console.log(`   🎯 Skills: ${counts[3].rows[0].count} records`);
    console.log(`   🖼️  Gallery: ${counts[4].rows[0].count} records`);
    
    dataClient.release();
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n🎉 Your portfolio database is ready to use!');
    console.log('\n💡 Next steps:');
    console.log('   1. Update the mock data in DynamicCard.tsx to use real database calls');
    console.log('   2. Test with bot responses like: "Here is my work: <work_current>"');
    console.log('   3. Add your real portfolio data through database inserts');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase(); 