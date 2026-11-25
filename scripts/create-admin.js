require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('../db');

const required = ['ADMIN_USER_CODE', 'ADMIN_FULL_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];

async function createAdmin() {
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  if (process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await db.ready;

  const [result] = await db.execute(
    `INSERT INTO users (user_code, full_name, email, password, role, is_active)
     VALUES (?, ?, ?, ?, 'admin', 1)`,
    [
      process.env.ADMIN_USER_CODE.trim(),
      process.env.ADMIN_FULL_NAME.trim(),
      process.env.ADMIN_EMAIL.trim().toLowerCase(),
      passwordHash,
    ]
  );

  console.log(`Administrator created successfully (user ID: ${result.insertId}).`);
}

createAdmin()
  .catch((err) => {
    console.error('Administrator provisioning failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
