const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('.tmp/data.db');

db.all("SELECT * FROM up_permissions WHERE action LIKE '%pago%'", [], (err, rows) => {
  if (err) {
    throw err;
  }
  console.log(rows);
});

db.close();
