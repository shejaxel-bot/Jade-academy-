// Cloud/local MySQL-compatible database connection.
const mysql = require('mysql2/promise');
require('dotenv').config();

const useSSL = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ...(useSSL ? {
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  } : {}),
});

// Server startup waits for this promise before accepting API traffic.
pool.ready = (async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ Database connected successfully');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    throw err;
  } finally {
    if (connection) connection.release();
  }
})();

module.exports = pool;
