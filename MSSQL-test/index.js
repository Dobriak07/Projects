const sql = require('mssql')
const sqlConfig = {
  user: 'sa',
  password: 'Sa123456',
  database: 'securos',
  server: '127.0.0.1',
  port: 1434,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  }
}

async function sqlTest() {
 try {
    console.log('Start');
  // make sure that any items are correctly URL encoded in the connection string
  let conn = await sql.connect(sqlConfig);
//   console.log(conn);
  const result = await sql.query(`select * from dbo.test`);
  console.log(result)
 } catch (err) {
    if(err) console.log(err.message);
  // ... error checks
 }
}

sqlTest();