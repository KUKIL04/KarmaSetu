import 'dotenv/config';
import { pool } from '../db/index.js';
import { CryptoService } from '../services/crypto.service.js';

async function seedSuperAdmin() {
  const email = 'admin@karmasetu.com';
  const password = 'rootpassword123'; // The default login password

  console.log(`\n⚙️  Initializing SuperAdmin Seed Protocol...`);
  console.log(`📧 Target Email: ${email}`);

  try {
    const hash = await CryptoService.hashPassword(password);
    
    // Upsert the SuperAdmin into the global identity matrix
    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, 
        gender, mobile_no, date_of_birth, mother_tongue,
        security_question_1, security_answer_1,
        security_question_2, security_answer_2,
        is_superadmin
      ) VALUES (
        $1, $2, 'System', 'Administrator', 
        'Other', '+00000000000', '1970-01-01', 'English',
        'System Initialization?', 'Karmasetu OS',
        'Clearance Level?', 'Omega',
        true
      )
      ON CONFLICT (email) DO UPDATE 
      SET is_superadmin = true, password_hash = $2
      RETURNING id, email, is_superadmin;
    `;

    const res = await pool.query(query, [email, hash]);
    
    console.log('\n✅ SUCCESS: Root User Provisioned!');
    console.log(`🆔 UUID: ${res.rows[0].id}`);
    console.log(`🔐 Clearance: is_superadmin = ${res.rows[0].is_superadmin}\n`);

  } catch (error) {
    console.error('\n❌ FATAL: Failed to seed SuperAdmin\n', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedSuperAdmin();